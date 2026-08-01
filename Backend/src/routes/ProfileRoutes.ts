import { ActivityLevel, Goal } from '@prisma/client';
import { Request, Response } from 'express';
import { isNumber, isString } from 'jet-validators';
import { transform } from 'jet-validators/utils';

import HttpStatusCodes from '@src/common/constants/HttpStatusCodes';
import ProfileService from '@src/services/ProfileService';

import { getUserId } from './common/auth';
import parseReq from './common/parseReq';

/******************************************************************************
                                Constants
******************************************************************************/

const isActivityLevel = (v: unknown): v is ActivityLevel =>
  isString(v) && v in ActivityLevel;
const isGoal = (v: unknown): v is Goal => isString(v) && v in Goal;
const isGender = (v: unknown): v is string => v === 'male' || v === 'female';

const reqValidators = {
  update: parseReq({
    heightCm: transform(Number, (v): v is number =>
      isNumber(v) && v > 50 && v < 250),
    weightKg: transform(Number, (v): v is number =>
      isNumber(v) && v > 20 && v < 300),
    age: transform(Number, (v): v is number =>
      isNumber(v) && v >= 15 && v <= 100),
    gender: isGender,
    activityLevel: isActivityLevel,
    goal: isGoal,
    monthlyBudget: transform(Number, (v): v is number =>
      isNumber(v) && v >= 300000),
  }),
} as const;

/******************************************************************************
                                Functions
******************************************************************************/

/**
 * Lấy hồ sơ hiện tại.
 *
 * @route GET /api/profile
 */
async function getProfile(_: Request, res: Response) {
  const profile = await ProfileService.getOne(getUserId(res));
  res.status(HttpStatusCodes.OK).json({ profile });
}

/**
 * Tạo/cập nhật hồ sơ + ngân sách.
 *
 * @route PUT /api/profile
 */
async function update(req: Request, res: Response) {
  const input = reqValidators.update(req.body);
  const profile = await ProfileService.upsert(getUserId(res), input);
  const targets = await ProfileService.getTargets(getUserId(res));
  res.status(HttpStatusCodes.OK).json({ profile, targets });
}

/**
 * Lấy chỉ số mục tiêu dinh dưỡng + ngân sách.
 *
 * @route GET /api/profile/targets
 */
async function getTargets(_: Request, res: Response) {
  const targets = await ProfileService.getTargets(getUserId(res));
  res.status(HttpStatusCodes.OK).json({ targets });
}

/******************************************************************************
                            Export default
******************************************************************************/

export default {
  getProfile,
  update,
  getTargets,
} as const;
