import { MealType } from '@prisma/client';
import OpenAI from 'openai';
import type {
  ChatCompletionMessageParam,
  ChatCompletionTool,
} from 'openai/resources/chat/completions';

import EnvVars from '@src/common/constants/env';
import HttpStatusCodes from '@src/common/constants/HttpStatusCodes';
import { RouteError } from '@src/common/utils/route-errors';

import LogService from './LogService';
import PlannerService, { formatDateOnly } from './PlannerService';
import ProfileService from './ProfileService';
import StatsService from './StatsService';
import StoreService from './StoreService';

/******************************************************************************
                                Constants
******************************************************************************/

const Errors = {
  NO_KEY:
    'Chưa cấu hình OPENAI_API_KEY. Thêm key vào Backend/config/.env.development rồi khởi động lại server.',
  EMPTY: 'Tin nhắn không được để trống',
  OPENAI: 'Không gọi được OpenAI. Kiểm tra API key và thử lại.',
} as const;

const MODEL = 'gpt-4o-mini';
const MAX_TOOL_ROUNDS = 6;

const MEAL_TYPES = new Set<string>(Object.values(MealType));

const TOOLS: ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'get_profile_and_targets',
      description:
        'Lấy hồ sơ người dùng (chiều cao, cân nặng, mục tiêu, ngân sách tháng) và chỉ số mục tiêu ngày (kcal, protein, ngân sách bữa).',
      parameters: { type: 'object', properties: {}, additionalProperties: false },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_daily_stats',
      description:
        'Tổng hợp dinh dưỡng và chi tiêu đã ghi nhận trong 1 ngày so với mục tiêu.',
      parameters: {
        type: 'object',
        properties: {
          date: {
            type: 'string',
            description: 'YYYY-MM-DD. Mặc định ngày đang xem.',
          },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_meal_plan',
      description: 'Lấy thực đơn đã tạo cho 1 ngày (các món + chi phí + protein).',
      parameters: {
        type: 'object',
        properties: {
          date: {
            type: 'string',
            description: 'YYYY-MM-DD. Mặc định ngày đang xem.',
          },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_meal_logs',
      description: 'Danh sách bữa đã ghi nhận (đã ăn) trong 1 ngày.',
      parameters: {
        type: 'object',
        properties: {
          date: {
            type: 'string',
            description: 'YYYY-MM-DD. Mặc định ngày đang xem.',
          },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_spending_stats',
      description: 'Thống kê chi tiêu thực tế vs ngân sách theo tuần hoặc tháng.',
      parameters: {
        type: 'object',
        properties: {
          range: {
            type: 'string',
            enum: ['week', 'month'],
            description: 'Khoảng thống kê. Mặc định week.',
          },
          end: {
            type: 'string',
            description: 'Ngày kết thúc YYYY-MM-DD. Mặc định hôm nay.',
          },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'compare_store_prices',
      description:
        'So sánh giá nguyên liệu của thực đơn 1 ngày giữa các cửa hàng đã crawl.',
      parameters: {
        type: 'object',
        properties: {
          date: {
            type: 'string',
            description: 'YYYY-MM-DD. Mặc định ngày đang xem.',
          },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'generate_meal_plan',
      description:
        'Tạo thực đơn mới cho 1 ngày hoặc cả tuần (ghi đè nếu đã có). Chỉ gọi khi người dùng muốn tạo/làm lại thực đơn.',
      parameters: {
        type: 'object',
        properties: {
          date: {
            type: 'string',
            description: 'Ngày bắt đầu YYYY-MM-DD.',
          },
          range: {
            type: 'string',
            enum: ['day', 'week'],
            description: 'day = 1 ngày, week = 7 ngày. Mặc định day.',
          },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'swap_meal',
      description:
        'Đổi món trong thực đơn theo itemId (lấy từ get_meal_plan). Chỉ gọi khi người dùng muốn đổi món.',
      parameters: {
        type: 'object',
        properties: {
          itemId: {
            type: 'number',
            description: 'ID của dòng món trong thực đơn.',
          },
        },
        required: ['itemId'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'log_meal',
      description:
        'Ghi nhận một bữa đã ăn (món tự nhập). Dùng khi người dùng kể họ đã ăn gì ngoài thực đơn.',
      parameters: {
        type: 'object',
        properties: {
          date: { type: 'string', description: 'YYYY-MM-DD' },
          mealType: {
            type: 'string',
            enum: ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'],
          },
          customName: { type: 'string', description: 'Tên món đã ăn' },
          protein: { type: 'number', description: 'Gram protein ước tính' },
          carb: { type: 'number', description: 'Gram carb ước tính' },
          fat: { type: 'number', description: 'Gram fat ước tính' },
          kcal: { type: 'number', description: 'Calo ước tính' },
          cost: { type: 'number', description: 'Chi phí VND ước tính' },
        },
        required: ['mealType', 'customName'],
        additionalProperties: false,
      },
    },
  },
];

/******************************************************************************
                                Types
******************************************************************************/

export interface IChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export type ChatAction =
  | 'plan_updated'
  | 'meal_swapped'
  | 'meal_logged';

export interface IChatResult {
  reply: string;
  actions: ChatAction[];
}

/******************************************************************************
                                Helpers
******************************************************************************/

function systemPrompt(focusDate: string): string {
  return `Bạn là trợ lý của StudentBites — app giúp sinh viên Việt Nam ăn đủ protein trong ngân sách tháng (chu cấp).

PHẠM VI BẮT BUỘC (chỉ trả lời trong phạm vi này):
- Hồ sơ / mục tiêu dinh dưỡng (protein, kcal, cân nặng, mục tiêu tăng cơ / giảm mỡ / giữ cân)
- Ngân sách ăn uống (chu cấp, chi tiêu ngày/tuần/tháng, VND)
- Thực đơn trong app (giải thích, tạo, đổi món)
- Nhật ký bữa đã ăn, thiếu/đủ protein hôm nay
- Mua sắm / so giá nguyên liệu cửa hàng trong app
- Cách dùng các tính năng StudentBites liên quan ăn uống

NGOÀI PHẠM VI — TỪ CHỐI NGẮN, KHÔNG TRẢ LỜI NỘI DUNG:
- Tin tức, chính trị, tổng thống, lịch sử, toán, lập trình, giải trí, thời tiết chung, kiến thức tổng quát không liên quan ăn uống sinh viên trong app
- Câu hỏi chỉ hỏi "hôm nay thứ mấy / ngày bao nhiêu" mà không gắn với thực đơn/dinh dưỡng: nhắc nhẹ rồi kéo về hỗ trợ ăn uống
- Không bịa kiến thức ngoài app. Không trả lời một phần rồi mới từ chối.

Khi ngoài phạm vi, trả lời đúng kiểu này (tiếng Việt, 1–3 câu):
"Mình chỉ hỗ trợ việc ăn uống, ngân sách và thực đơn trong StudentBites thôi. Bạn hỏi về protein hôm nay, thực đơn, đổi món hoặc chi tiêu nhé."

Vai trò trong phạm vi:
- Ngắn gọn, thân thiện, tiếng Việt.
- Dùng tool để lấy số liệu thật — không bịa protein/giá/ngân sách.
- Gợi ý hành động cụ thể (đổi món, tạo thực đơn, ghi nhật ký, so giá).

Quy tắc dữ liệu:
- Ngày đang xem mặc định: ${focusDate}. Nếu user không nêu ngày khác thì dùng ngày này.
- Tiền: VND. Protein: gram.
- Không kê đơn thuốc / chẩn đoán bệnh.
- Khi đổi món / tạo thực đơn / ghi nhật ký: gọi tool rồi xác nhận ngắn.
- Trả lời 2–6 câu khi trong phạm vi. Có thể dùng gạch đầu dòng ngắn.

Công cụ: hồ sơ & mục tiêu, thống kê ngày, thực đơn, nhật ký ăn, chi tiêu tuần/tháng, so giá cửa hàng, tạo thực đơn, đổi món, ghi món đã ăn.`;
}

function asDate(raw: unknown, fallback: string): string {
  return typeof raw === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw)
    ? raw
    : fallback;
}

function asMealType(raw: unknown): MealType | null {
  return typeof raw === 'string' && MEAL_TYPES.has(raw)
    ? (raw as MealType)
    : null;
}

function getClient(): OpenAI {
  const key = EnvVars.OpenAiApiKey?.trim();
  if (!key) {
    throw new RouteError(HttpStatusCodes.SERVICE_UNAVAILABLE, Errors.NO_KEY);
  }
  return new OpenAI({ apiKey: key });
}

async function runTool(
  userId: number,
  focusDate: string,
  name: string,
  argsJson: string,
  actions: ChatAction[],
): Promise<unknown> {
  let args: Record<string, unknown>;
  try {
    args = argsJson ? (JSON.parse(argsJson) as Record<string, unknown>) : {};
  } catch {
    return { error: 'Tham số tool không hợp lệ' };
  }

  try {
    switch (name) {
      case 'get_profile_and_targets': {
        const profile = await ProfileService.getOne(userId);
        const targets = await ProfileService.getTargets(userId);
        return { profile, targets };
      }
      case 'get_daily_stats':
        return StatsService.daily(userId, asDate(args.date, focusDate));
      case 'get_meal_plan': {
        const plan = await PlannerService.getForDate(
          userId,
          asDate(args.date, focusDate),
        );
        return { plan };
      }
      case 'get_meal_logs': {
        const date = asDate(args.date, focusDate);
        const logs = await LogService.getDay(userId, date);
        return { date, logs };
      }
      case 'get_spending_stats': {
        const range = args.range === 'month' ? 'month' : 'week';
        const end = asDate(args.end, focusDate);
        return StatsService.spending(userId, range, end);
      }
      case 'compare_store_prices':
        return StoreService.compare(userId, asDate(args.date, focusDate));
      case 'generate_meal_plan': {
        const date = asDate(args.date, focusDate);
        const range = args.range === 'week' ? 'week' : 'day';
        const plans = await PlannerService.generate(userId, date, range);
        actions.push('plan_updated');
        return {
          range,
          plans: plans.map((p) => ({
            date: p.date,
            totals: p.totals,
            budgetStatus: p.budgetStatus,
            items: p.items.map((it) => ({
              id: it.id,
              mealType: it.mealType,
              name: it.dish.name,
              protein: it.dish.protein,
              cost: it.estimatedCost,
            })),
          })),
        };
      }
      case 'swap_meal': {
        const itemId = Number(args.itemId);
        if (!Number.isFinite(itemId)) {
          return { error: 'itemId không hợp lệ' };
        }
        const plan = await PlannerService.swap(userId, itemId);
        actions.push('meal_swapped');
        return {
          date: plan.date,
          totals: plan.totals,
          budgetStatus: plan.budgetStatus,
          items: plan.items.map((it) => ({
            id: it.id,
            mealType: it.mealType,
            name: it.dish.name,
            protein: it.dish.protein,
            cost: it.estimatedCost,
          })),
        };
      }
      case 'log_meal': {
        const mealType = asMealType(args.mealType);
        if (!mealType || typeof args.customName !== 'string') {
          return { error: 'Cần mealType và customName' };
        }
        const toNum = (v: unknown) =>
          v == null || v === '' ? undefined : Number(v);
        const log = await LogService.add(userId, {
          date: asDate(args.date, focusDate),
          mealType,
          customName: args.customName,
          protein: toNum(args.protein),
          carb: toNum(args.carb),
          fat: toNum(args.fat),
          kcal: toNum(args.kcal),
          cost: toNum(args.cost),
        });
        actions.push('meal_logged');
        return { log };
      }
      default:
        return { error: `Không biết tool ${name}` };
    }
  } catch (err) {
    if (err instanceof RouteError) {
      return { error: err.message };
    }
    return {
      error: err instanceof Error ? err.message : 'Lỗi khi chạy tool',
    };
  }
}

/******************************************************************************
                                Functions
******************************************************************************/

/**
 * Hội thoại với OpenAI: model gọi tool trên dữ liệu thật của user rồi trả lời.
 */
async function chat(
  userId: number,
  messages: IChatMessage[],
  focusDate?: string,
): Promise<IChatResult> {
  const cleaned = messages
    .filter(
      (m) =>
        (m.role === 'user' || m.role === 'assistant') &&
        typeof m.content === 'string' &&
        m.content.trim().length > 0,
    )
    .slice(-20)
    .map((m) => ({ role: m.role, content: m.content.trim() }));

  if (cleaned.length === 0 || cleaned[cleaned.length - 1]?.role !== 'user') {
    throw new RouteError(HttpStatusCodes.BAD_REQUEST, Errors.EMPTY);
  }

  const date =
    focusDate && /^\d{4}-\d{2}-\d{2}$/.test(focusDate)
      ? focusDate
      : formatDateOnly(new Date());

  const client = getClient();
  const actions: ChatAction[] = [];
  const thread: ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt(date) },
    ...cleaned,
  ];

  try {
    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      const completion = await client.chat.completions.create({
        model: MODEL,
        messages: thread,
        tools: TOOLS,
        tool_choice: 'auto',
        temperature: 0.2,
      });

      const choice = completion.choices[0]?.message;
      if (!choice) {
        throw new RouteError(
          HttpStatusCodes.BAD_GATEWAY,
          Errors.OPENAI,
        );
      }

      thread.push(choice);

      const toolCalls = choice.tool_calls;
      if (!toolCalls?.length) {
        const reply = (choice.content ?? '').trim();
        return {
          reply:
            reply ||
            'Mình chưa có câu trả lời rõ. Bạn hỏi lại giúp mình nhé.',
          actions: [...new Set(actions)],
        };
      }

      for (const call of toolCalls) {
        if (call.type !== 'function') continue;
        const result = await runTool(
          userId,
          date,
          call.function.name,
          call.function.arguments,
          actions,
        );
        thread.push({
          role: 'tool',
          tool_call_id: call.id,
          content: JSON.stringify(result),
        });
      }
    }
  } catch (err) {
    if (err instanceof RouteError) throw err;
    throw new RouteError(
      HttpStatusCodes.BAD_GATEWAY,
      err instanceof Error ? err.message : Errors.OPENAI,
    );
  }

  return {
    reply:
      'Mình đang xử lý hơi nhiều bước. Bạn hỏi ngắn hơn giúp mình nhé.',
    actions: [...new Set(actions)],
  };
}

/******************************************************************************
                            Export default
******************************************************************************/

export default {
  Errors,
  chat,
} as const;
