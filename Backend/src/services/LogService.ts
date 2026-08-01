import { MealType } from '@prisma/client';

import HttpStatusCodes from '@src/common/constants/HttpStatusCodes';
import { RouteError } from '@src/common/utils/route-errors';
import prisma from '@src/repos/prisma';

import { formatDateOnly, parseDateOnly } from './PlannerService';

/******************************************************************************
                                Constants
******************************************************************************/

const Errors = {
  DISH_NOT_FOUND: 'Không tìm thấy món ăn',
  LOG_NOT_FOUND: 'Không tìm thấy nhật ký',
  MISSING_INPUT: 'Cần dishId hoặc thông tin món tự nhập (customName + macro)',
} as const;

/******************************************************************************
                                Types
******************************************************************************/

export interface IAddLogInput {
  date: string;
  mealType: MealType;
  dishId?: number;
  customName?: string;
  protein?: number;
  carb?: number;
  fat?: number;
  kcal?: number;
  cost?: number;
}

/******************************************************************************
                                Functions
******************************************************************************/

/**
 * Ghi nhận 1 bữa đã ăn (từ món gợi ý hoặc món tự nhập).
 */
async function add(userId: number, input: IAddLogInput) {
  const date = parseDateOnly(input.date);
  if (input.dishId) {
    const dish = await prisma.dish.findUnique({ where: { id: input.dishId } });
    if (!dish) {
      throw new RouteError(HttpStatusCodes.NOT_FOUND, Errors.DISH_NOT_FOUND);
    }
    return prisma.mealLog.create({
      data: {
        userId,
        date,
        mealType: input.mealType,
        dishId: dish.id,
        protein: dish.protein,
        carb: dish.carb,
        fat: dish.fat,
        kcal: dish.kcal,
        cost: input.cost ?? dish.estimatedCost,
      },
    });
  }
  if (!input.customName) {
    throw new RouteError(HttpStatusCodes.BAD_REQUEST, Errors.MISSING_INPUT);
  }
  return prisma.mealLog.create({
    data: {
      userId,
      date,
      mealType: input.mealType,
      customName: input.customName,
      protein: input.protein ?? 0,
      carb: input.carb ?? 0,
      fat: input.fat ?? 0,
      kcal: input.kcal ?? 0,
      cost: input.cost ?? 0,
    },
  });
}

/**
 * Lịch sử theo tháng: tổng hợp từng ngày (protein, kcal, chi phí, số bữa).
 */
async function getMonth(userId: number, month: string) {
  const start = parseDateOnly(`${month}-01`);
  const end = new Date(start);
  end.setUTCMonth(end.getUTCMonth() + 1);
  const logs = await prisma.mealLog.findMany({
    where: { userId, date: { gte: start, lt: end } },
    orderBy: { date: 'asc' },
  });
  const byDay = new Map<
    string,
    { protein: number; kcal: number; cost: number; meals: number }
  >();
  for (const log of logs) {
    const key = formatDateOnly(log.date);
    const day = byDay.get(key) ?? { protein: 0, kcal: 0, cost: 0, meals: 0 };
    day.protein += log.protein;
    day.kcal += log.kcal;
    day.cost += log.cost;
    day.meals += 1;
    byDay.set(key, day);
  }
  return [...byDay.entries()].map(([date, totals]) => ({
    date,
    ...totals,
    protein: Math.round(totals.protein * 10) / 10,
    kcal: Math.round(totals.kcal),
  }));
}

/**
 * Chi tiết các bữa đã ăn trong 1 ngày.
 */
async function getDay(userId: number, dateStr: string) {
  const date = parseDateOnly(dateStr);
  const logs = await prisma.mealLog.findMany({
    where: { userId, date },
    include: { dish: { select: { name: true, description: true } } },
    orderBy: { eatenAt: 'asc' },
  });
  return logs.map((log) => ({
    id: log.id,
    mealType: log.mealType,
    name: log.dish?.name ?? log.customName ?? 'Món khác',
    protein: log.protein,
    carb: log.carb,
    fat: log.fat,
    kcal: log.kcal,
    cost: log.cost,
    eatenAt: log.eatenAt,
  }));
}

/**
 * Xóa 1 dòng nhật ký.
 */
async function remove(userId: number, id: number) {
  const log = await prisma.mealLog.findUnique({ where: { id } });
  if (!log || log.userId !== userId) {
    throw new RouteError(HttpStatusCodes.NOT_FOUND, Errors.LOG_NOT_FOUND);
  }
  await prisma.mealLog.delete({ where: { id } });
}

/******************************************************************************
                            Export default
******************************************************************************/

export default {
  Errors,
  add,
  getMonth,
  getDay,
  remove,
} as const;
