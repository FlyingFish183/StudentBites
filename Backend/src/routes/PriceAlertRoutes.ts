import { Request, Response } from 'express';

import HttpStatusCodes from '@src/common/constants/HttpStatusCodes';
import PriceAlertService from '@src/services/PriceAlertService';

import { getUserId } from './common/auth';

/******************************************************************************
                                Functions
******************************************************************************/

/**
 * Tạo cảnh báo giá cho một nguyên liệu.
 *
 * @route POST /api/price-alerts
 */
async function create(req: Request, res: Response) {
  const userId = getUserId(res);
  const { ingredientId, thresholdPct } = req.body;

  const ingIdNum = Number(ingredientId);
  if (!Number.isInteger(ingIdNum) || ingIdNum <= 0) {
    return res
      .status(HttpStatusCodes.BAD_REQUEST)
      .json({ error: 'ingredientId không hợp lệ' });
  }

  const rawThreshold = thresholdPct;
  const thresholdNum =
    rawThreshold === undefined || rawThreshold === null
      ? 10
      : Number(rawThreshold);
  if (!Number.isFinite(thresholdNum) || thresholdNum < 0 || thresholdNum > 100) {
    return res
      .status(HttpStatusCodes.BAD_REQUEST)
      .json({ error: 'thresholdPct không hợp lệ (0–100)' });
  }

  const alert = await PriceAlertService.createAlert(userId, ingIdNum, thresholdNum);
  res.status(HttpStatusCodes.CREATED).json({ alert });
}

/**
 * Lấy danh sách cảnh báo giá của người dùng.
 *
 * @route GET /api/price-alerts
 */
async function list(_req: Request, res: Response) {
  const userId = getUserId(res);
  const alerts = await PriceAlertService.getUserAlerts(userId);
  res.status(HttpStatusCodes.OK).json({ alerts });
}

/**
 * Xoá một cảnh báo giá.
 *
 * @route DELETE /api/price-alerts/:id
 */
async function remove(req: Request, res: Response) {
  const userId = getUserId(res);
  await PriceAlertService.deleteAlert(userId, Number(req.params.id));
  res.status(HttpStatusCodes.OK).json({ success: true });
}

/******************************************************************************
                            Export default
******************************************************************************/

export default { create, list, remove } as const;
