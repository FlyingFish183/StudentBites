import HttpStatusCodes from '@src/common/constants/HttpStatusCodes';
import {
  calcTargets,
  INutritionTargets,
  IProfileInput,
} from '@src/common/utils/nutrition';
import { RouteError } from '@src/common/utils/route-errors';
import prisma from '@src/repos/prisma';

/******************************************************************************
                                Constants
******************************************************************************/

const Errors = {
  NO_PROFILE: 'Chưa thiết lập hồ sơ. Vui lòng hoàn thành onboarding.',
} as const;

/******************************************************************************
                                Functions
******************************************************************************/

/**
 * Lấy hồ sơ của user.
 */
async function getOne(userId: number) {
  const profile = await prisma.profile.findUnique({ where: { userId } });
  if (!profile) {
    throw new RouteError(HttpStatusCodes.NOT_FOUND, Errors.NO_PROFILE);
  }
  return profile;
}

/**
 * Tạo/cập nhật hồ sơ (thể trạng, mục tiêu, ngân sách tháng).
 */
async function upsert(userId: number, input: IProfileInput) {
  return prisma.profile.upsert({
    where: { userId },
    update: { ...input },
    create: { userId, ...input },
  });
}

/**
 * Tính chỉ số mục tiêu (kcal, protein, ngân sách ngày/bữa) từ hồ sơ.
 */
async function getTargets(userId: number): Promise<INutritionTargets> {
  const profile = await getOne(userId);
  return calcTargets({
    heightCm: profile.heightCm,
    weightKg: profile.weightKg,
    age: profile.age,
    gender: profile.gender,
    // Prisma đã trả về đúng kiểu enum rồi, không cần ép lại.
    activityLevel: profile.activityLevel,
    goal: profile.goal,
    monthlyBudget: profile.monthlyBudget,
  });
}

/******************************************************************************
                            Export default
******************************************************************************/

export default {
  Errors,
  getOne,
  upsert,
  getTargets,
} as const;
