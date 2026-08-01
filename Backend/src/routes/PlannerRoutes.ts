import { Request, Response } from 'express';
import { isNumber, isString } from 'jet-validators';
import { transform } from 'jet-validators/utils';

import HttpStatusCodes from '@src/common/constants/HttpStatusCodes';
import PlannerService, { formatDateOnly } from '@src/services/PlannerService';

import { getUserId } from './common/auth';
import parseReq from './common/parseReq';

/******************************************************************************
                                Constants
******************************************************************************/

const isDateStr = (v: unknown): v is string =>
  isString(v) && /^\d{4}-\d{2}-\d{2}$/.test(v);
const isRange = (v: unknown): v is 'day' | 'week' =>
  v === 'day' || v === 'week';

const reqValidators = {
  generate: parseReq({ date: isDateStr, range: isRange }),
  swap: parseReq({ itemId: transform(Number, isNumber) }),
} as const;

/******************************************************************************
                                Functions
******************************************************************************/

/**
 * Lấy thực đơn của 1 ngày.
 *
 * @route GET /api/planner?date=YYYY-MM-DD
 */
async function getPlan(req: Request, res: Response) {
  const dateStr = isDateStr(req.query.date)
    ? req.query.date
    : formatDateOnly(new Date());
  const plan = await PlannerService.getForDate(getUserId(res), dateStr);
  res.status(HttpStatusCodes.OK).json({ plan });
}

/**
 * Tạo thực đơn mới cho ngày/tuần.
 *
 * @route POST /api/planner/generate
 */
async function generate(req: Request, res: Response) {
  const { date, range } = reqValidators.generate(req.body);
  const plans = await PlannerService.generate(getUserId(res), date, range);
  res.status(HttpStatusCodes.OK).json({ plans });
}

/**
 * Đổi món trong thực đơn.
 *
 * @route POST /api/planner/swap
 */
async function swap(req: Request, res: Response) {
  const { itemId } = reqValidators.swap(req.body);
  const plan = await PlannerService.swap(getUserId(res), itemId);
  res.status(HttpStatusCodes.OK).json({ plan });
}

/******************************************************************************
                            Export default
******************************************************************************/

export default {
  getPlan,
  generate,
  swap,
} as const;
