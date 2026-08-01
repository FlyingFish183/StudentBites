import { MealType } from '@prisma/client';
import { Request, Response } from 'express';
import { isNumber, isString } from 'jet-validators';
import { transform } from 'jet-validators/utils';

import HttpStatusCodes from '@src/common/constants/HttpStatusCodes';
import LogService from '@src/services/LogService';
import { formatDateOnly } from '@src/services/PlannerService';
import StatsService from '@src/services/StatsService';

import { getUserId } from './common/auth';
import parseReq from './common/parseReq';

/******************************************************************************
                                Constants
******************************************************************************/

const isDateStr = (v: unknown): v is string =>
  isString(v) && /^\d{4}-\d{2}-\d{2}$/.test(v);
const isMonthStr = (v: unknown): v is string =>
  isString(v) && /^\d{4}-\d{2}$/.test(v);
const isMealType = (v: unknown): v is MealType =>
  isString(v) && v in MealType;

const reqValidators = {
  deleteLog: parseReq({ id: transform(Number, isNumber) }),
} as const;

/******************************************************************************
                            Log Functions
******************************************************************************/

/**
 * Ghi nhận bữa đã ăn.
 *
 * @route POST /api/logs
 */
async function addLog(req: Request, res: Response) {
  const body = req.body as Record<string, unknown>;
  if (!isDateStr(body.date) || !isMealType(body.mealType)) {
    res
      .status(HttpStatusCodes.BAD_REQUEST)
      .json({ error: 'date (YYYY-MM-DD) và mealType là bắt buộc' });
    return;
  }
  const toNum = (v: unknown) => (v == null ? undefined : Number(v));
  const log = await LogService.add(getUserId(res), {
    date: body.date,
    mealType: body.mealType,
    dishId: toNum(body.dishId),
    customName: isString(body.customName) ? body.customName : undefined,
    protein: toNum(body.protein),
    carb: toNum(body.carb),
    fat: toNum(body.fat),
    kcal: toNum(body.kcal),
    cost: toNum(body.cost),
  });
  res.status(HttpStatusCodes.CREATED).json({ log });
}

/**
 * Lịch sử tháng.
 *
 * @route GET /api/logs?month=YYYY-MM
 */
async function getMonth(req: Request, res: Response) {
  const month = isMonthStr(req.query.month)
    ? req.query.month
    : formatDateOnly(new Date()).slice(0, 7);
  const days = await LogService.getMonth(getUserId(res), month);
  res.status(HttpStatusCodes.OK).json({ month, days });
}

/**
 * Chi tiết 1 ngày.
 *
 * @route GET /api/logs/day/:date
 */
async function getDay(req: Request, res: Response) {
  const date = req.params.date;
  if (!isDateStr(date)) {
    res
      .status(HttpStatusCodes.BAD_REQUEST)
      .json({ error: 'date phải có dạng YYYY-MM-DD' });
    return;
  }
  const logs = await LogService.getDay(getUserId(res), date);
  res.status(HttpStatusCodes.OK).json({ date, logs });
}

/**
 * Xóa nhật ký.
 *
 * @route DELETE /api/logs/:id
 */
async function deleteLog(req: Request, res: Response) {
  const { id } = reqValidators.deleteLog(req.params);
  await LogService.remove(getUserId(res), id);
  res.status(HttpStatusCodes.OK).json({ ok: true });
}

/******************************************************************************
                            Stats Functions
******************************************************************************/

/**
 * Tổng hợp dinh dưỡng ngày.
 *
 * @route GET /api/stats/daily?date=YYYY-MM-DD
 */
async function statsDaily(req: Request, res: Response) {
  const date = isDateStr(req.query.date)
    ? req.query.date
    : formatDateOnly(new Date());
  const stats = await StatsService.daily(getUserId(res), date);
  res.status(HttpStatusCodes.OK).json(stats);
}

/**
 * Thống kê chi tiêu.
 *
 * @route GET /api/stats/spending?range=week|month&end=YYYY-MM-DD
 */
async function statsSpending(req: Request, res: Response) {
  const range = req.query.range === 'month' ? 'month' : 'week';
  const end = isDateStr(req.query.end)
    ? req.query.end
    : formatDateOnly(new Date());
  const stats = await StatsService.spending(getUserId(res), range, end);
  res.status(HttpStatusCodes.OK).json(stats);
}

/******************************************************************************
                            Export default
******************************************************************************/

export default {
  addLog,
  getMonth,
  getDay,
  deleteLog,
  statsDaily,
  statsSpending,
} as const;
