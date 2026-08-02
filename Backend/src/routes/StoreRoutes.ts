import { Request, Response } from 'express';
import { isString } from 'jet-validators';

import HttpStatusCodes from '@src/common/constants/HttpStatusCodes';
import { formatDateOnly } from '@src/services/PlannerService';
import StoreService from '@src/services/StoreService';

import { getUserId } from './common/auth';

/******************************************************************************
                                Constants
******************************************************************************/

const isDateStr = (v: unknown): v is string =>
  isString(v) && /^\d{4}-\d{2}-\d{2}$/.test(v);

const MIN_RADIUS = 300;
const MAX_RADIUS = 5000;

/******************************************************************************
                                Functions
******************************************************************************/

/**
 * Tìm cửa hàng gần vị trí.
 *
 * @route GET /api/stores/nearby?lat=&lng=&radius=
 */
async function nearby(req: Request, res: Response) {
  const lat = Number(req.query.lat);
  const lng = Number(req.query.lng);
  const radius = Math.min(
    Math.max(Number(req.query.radius) || 2000, MIN_RADIUS),
    MAX_RADIUS,
  );
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    res
      .status(HttpStatusCodes.BAD_REQUEST)
      .json({ error: 'lat và lng là bắt buộc' });
    return;
  }
  const stores = await StoreService.nearby(lat, lng, radius);
  res.status(HttpStatusCodes.OK).json({ stores, radius });
}

/**
 * Tìm tọa độ từ địa chỉ.
 *
 * @route GET /api/stores/geocode?q=
 */
async function geocode(req: Request, res: Response) {
  const q = req.query.q;
  if (!isString(q) || q.trim().length < 3) {
    res
      .status(HttpStatusCodes.BAD_REQUEST)
      .json({ error: 'Địa chỉ tìm kiếm quá ngắn' });
    return;
  }
  const results = await StoreService.geocode(q.trim());
  res.status(HttpStatusCodes.OK).json({ results });
}

/**
 * So sánh giá nguyên liệu cho thực đơn của ngày.
 *
 * @route GET /api/stores/compare?date=YYYY-MM-DD
 */
async function compare(req: Request, res: Response) {
  const date = isDateStr(req.query.date)
    ? req.query.date
    : formatDateOnly(new Date());
  const result = await StoreService.compare(getUserId(res), date);
  res.status(HttpStatusCodes.OK).json(result);
}

/**
 * Tìm nguyên liệu theo từ khoá và so giá giữa 3 nguồn crawl.
 *
 * @route GET /api/stores/search?q=
 */
async function search(req: Request, res: Response) {
  const q = req.query.q;
  if (!isString(q)) {
    res
      .status(HttpStatusCodes.BAD_REQUEST)
      .json({ error: 'Thiếu từ khoá tìm kiếm' });
    return;
  }
  if (q.trim().length < 2) {
    res
      .status(HttpStatusCodes.BAD_REQUEST)
      .json({ error: 'Từ khoá tìm kiếm quá ngắn' });
    return;
  }
  const result = await StoreService.search(q);
  res.status(HttpStatusCodes.OK).json(result);
}

/******************************************************************************
                            Export default
******************************************************************************/

export default {
  nearby,
  geocode,
  compare,
  search,
} as const;
