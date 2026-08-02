import { Request, Response } from 'express';
import { isString } from 'jet-validators';

import HttpStatusCodes from '@src/common/constants/HttpStatusCodes';
import ChatService, { IChatMessage } from '@src/services/ChatService';

import { getUserId } from './common/auth';

/******************************************************************************
                                Helpers
******************************************************************************/

const isDateStr = (v: unknown): v is string =>
  isString(v) && /^\d{4}-\d{2}-\d{2}$/.test(v);

function parseMessages(raw: unknown): IChatMessage[] | null {
  if (!Array.isArray(raw)) return null;
  const out: IChatMessage[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') return null;
    const role = (item as { role?: unknown }).role;
    const content = (item as { content?: unknown }).content;
    if (
      (role !== 'user' && role !== 'assistant') ||
      typeof content !== 'string'
    ) {
      return null;
    }
    out.push({ role, content });
  }
  return out;
}

/******************************************************************************
                                Functions
******************************************************************************/

/**
 * Gửi hội thoại tới trợ lý AI (OpenAI + tool gọi dữ liệu app).
 *
 * @route POST /api/chat
 */
async function send(req: Request, res: Response) {
  const body = req.body as Record<string, unknown>;
  const messages = parseMessages(body.messages);
  if (!messages) {
    res
      .status(HttpStatusCodes.BAD_REQUEST)
      .json({ error: 'messages phải là mảng { role, content }' });
    return;
  }
  const date = isDateStr(body.date) ? body.date : undefined;
  const result = await ChatService.chat(getUserId(res), messages, date);
  res.status(HttpStatusCodes.OK).json(result);
}

/******************************************************************************
                            Export default
******************************************************************************/

export default { send } as const;
