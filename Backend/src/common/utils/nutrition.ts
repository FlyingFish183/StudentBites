import { ActivityLevel, Goal, MealType } from '@prisma/client';

/******************************************************************************
                                Types
******************************************************************************/

export interface IProfileInput {
  heightCm: number;
  weightKg: number;
  age: number;
  gender: string; // 'male' | 'female'
  activityLevel: ActivityLevel;
  goal: Goal;
  monthlyBudget: number;
}

export interface INutritionTargets {
  kcalTarget: number;
  proteinTarget: number; // g/ngày
  carbTarget: number;
  fatTarget: number;
  dailyBudget: number; // VND, ngân sách trung bình / ngày
  mealBudgets: Record<MealType, number>;
}

/******************************************************************************
                                Constants
******************************************************************************/

const ACTIVITY_FACTORS: Record<ActivityLevel, number> = {
  SEDENTARY: 1.2,
  LIGHT: 1.375,
  MODERATE: 1.55,
  ACTIVE: 1.725,
  VERY_ACTIVE: 1.9,
};

// g protein / kg thể trọng theo mục tiêu
const PROTEIN_PER_KG: Record<Goal, number> = {
  GAIN_MUSCLE: 2.0,
  LOSE_FAT: 2.2,
  MAINTAIN: 1.6,
};

// điều chỉnh calories theo mục tiêu
const KCAL_ADJUST: Record<Goal, number> = {
  GAIN_MUSCLE: 300,
  LOSE_FAT: -300,
  MAINTAIN: 0,
};

// tỉ lệ chia ngân sách ngày cho từng bữa
export const MEAL_BUDGET_SPLIT: Record<MealType, number> = {
  BREAKFAST: 0.25,
  LUNCH: 0.35,
  DINNER: 0.3,
  SNACK: 0.1,
};

/******************************************************************************
                                Functions
******************************************************************************/

/**
 * BMR theo công thức Mifflin-St Jeor.
 */
export function calcBmr(p: IProfileInput): number {
  const base = 10 * p.weightKg + 6.25 * p.heightCm - 5 * p.age;
  return p.gender === 'female' ? base - 161 : base + 5;
}

/**
 * Số ngày trong tháng của một ngày bất kỳ.
 */
export function daysInMonth(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

/**
 * Tính toàn bộ chỉ số mục tiêu dinh dưỡng + ngân sách từ hồ sơ.
 */
export function calcTargets(
  p: IProfileInput,
  date: Date = new Date(),
): INutritionTargets {
  const tdee = calcBmr(p) * ACTIVITY_FACTORS[p.activityLevel];
  const kcalTarget = Math.round(tdee + KCAL_ADJUST[p.goal]);
  const proteinTarget = Math.round(p.weightKg * PROTEIN_PER_KG[p.goal]);
  // Fat ~25% calories, phần còn lại là carb
  const fatTarget = Math.round((kcalTarget * 0.25) / 9);
  const carbTarget = Math.round(
    (kcalTarget - proteinTarget * 4 - fatTarget * 9) / 4,
  );
  const dailyBudget = Math.floor(p.monthlyBudget / daysInMonth(date));
  const mealBudgets = Object.fromEntries(
    Object.entries(MEAL_BUDGET_SPLIT).map(([meal, ratio]) => [
      meal,
      Math.round(dailyBudget * ratio),
    ]),
  ) as Record<MealType, number>;
  return {
    kcalTarget,
    proteinTarget,
    carbTarget,
    fatTarget,
    dailyBudget,
    mealBudgets,
  };
}
