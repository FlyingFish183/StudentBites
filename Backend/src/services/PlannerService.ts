import { MealType } from '@prisma/client';

import HttpStatusCodes from '@src/common/constants/HttpStatusCodes';
import { RouteError } from '@src/common/utils/route-errors';
import prisma from '@src/repos/prisma';

import {
  calcMenuTotals,
  findAlternative,
  IDayMenu,
  IDishLite,
  pickMenuForDay,
} from './planner-algorithm';
import ProfileService from './ProfileService';

/******************************************************************************
                                Constants
******************************************************************************/

const Errors = {
  PLAN_ITEM_NOT_FOUND: 'Không tìm thấy món trong thực đơn',
  NO_ALTERNATIVE: 'Không còn món thay thế phù hợp',
} as const;

/******************************************************************************
                                Types
******************************************************************************/

export interface IDayPlanResult {
  date: string;
  items: {
    id: number;
    mealType: MealType;
    dish: IDishLite;
    estimatedCost: number;
  }[];
  totals: ReturnType<typeof calcMenuTotals>;
  budgetStatus: {
    dailyBudget: number;
    totalCost: number;
    overBudget: boolean;
    diff: number; // dương = còn dư, âm = vượt
  };
}

/******************************************************************************
                                Helpers
******************************************************************************/

export function parseDateOnly(s: string): Date {
  return new Date(`${s}T00:00:00.000Z`);
}

export function formatDateOnly(d: Date): string {
  return d.toISOString().slice(0, 10);
}

async function getAllDishes(): Promise<IDishLite[]> {
  return prisma.dish.findMany();
}

async function buildDayResult(
  userId: number,
  planId: number,
  date: Date,
): Promise<IDayPlanResult> {
  const targets = await ProfileService.getTargets(userId);
  const items = await prisma.mealPlanItem.findMany({
    where: { mealPlanId: planId },
    include: { dish: true },
    orderBy: { id: 'asc' },
  });
  const menu: IDayMenu = {};
  for (const it of items) {
    menu[it.mealType] = it.dish;
  }
  const totals = calcMenuTotals(menu);
  return {
    date: formatDateOnly(date),
    items: items.map((it) => ({
      id: it.id,
      mealType: it.mealType,
      dish: it.dish,
      estimatedCost: it.estimatedCost,
    })),
    totals,
    budgetStatus: {
      dailyBudget: targets.dailyBudget,
      totalCost: totals.cost,
      overBudget: totals.cost > targets.dailyBudget,
      diff: targets.dailyBudget - totals.cost,
    },
  };
}

/******************************************************************************
                                Functions
******************************************************************************/

/**
 * Tạo thực đơn cho 1 ngày hoặc 7 ngày kể từ startDate.
 */
async function generate(
  userId: number,
  startDate: string,
  range: 'day' | 'week',
): Promise<IDayPlanResult[]> {
  const targets = await ProfileService.getTargets(userId);
  const dishes = await getAllDishes();
  const numDays = range === 'week' ? 7 : 1;
  const results: IDayPlanResult[] = [];

  for (let i = 0; i < numDays; i++) {
    const date = parseDateOnly(startDate);
    date.setUTCDate(date.getUTCDate() + i);

    const menu = pickMenuForDay(dishes, targets);
    const plan = await prisma.mealPlan.upsert({
      where: { userId_date: { userId, date } },
      update: {},
      create: { userId, date },
    });
    // thay toàn bộ items cũ
    await prisma.mealPlanItem.deleteMany({ where: { mealPlanId: plan.id } });
    const entries = Object.entries(menu) as [MealType, IDishLite][];
    await prisma.mealPlanItem.createMany({
      data: entries.map(([mealType, dish]) => ({
        mealPlanId: plan.id,
        mealType,
        dishId: dish.id,
        estimatedCost: dish.estimatedCost,
      })),
    });
    results.push(await buildDayResult(userId, plan.id, date));
  }
  return results;
}

/**
 * Lấy thực đơn đã tạo của 1 ngày (null nếu chưa có).
 */
async function getForDate(
  userId: number,
  dateStr: string,
): Promise<IDayPlanResult | null> {
  const date = parseDateOnly(dateStr);
  const plan = await prisma.mealPlan.findUnique({
    where: { userId_date: { userId, date } },
  });
  if (!plan) return null;
  return buildDayResult(userId, plan.id, date);
}

/**
 * Đổi món: thay 1 item trong plan bằng món tương đương.
 */
async function swap(userId: number, itemId: number): Promise<IDayPlanResult> {
  const item = await prisma.mealPlanItem.findUnique({
    where: { id: itemId },
    include: { mealPlan: true, dish: true },
  });
  if (!item || item.mealPlan.userId !== userId) {
    throw new RouteError(
      HttpStatusCodes.NOT_FOUND,
      Errors.PLAN_ITEM_NOT_FOUND,
    );
  }
  const siblingItems = await prisma.mealPlanItem.findMany({
    where: { mealPlanId: item.mealPlanId },
  });
  const usedDishIds = siblingItems.map((s) => s.dishId);
  const dishes = await getAllDishes();
  const alt = findAlternative(dishes, item.mealType, item.dish, usedDishIds);
  if (!alt) {
    throw new RouteError(HttpStatusCodes.BAD_REQUEST, Errors.NO_ALTERNATIVE);
  }
  await prisma.mealPlanItem.update({
    where: { id: itemId },
    data: { dishId: alt.id, estimatedCost: alt.estimatedCost },
  });
  return buildDayResult(userId, item.mealPlanId, item.mealPlan.date);
}

/******************************************************************************
                            Export default
******************************************************************************/

export default {
  Errors,
  generate,
  getForDate,
  swap,
} as const;
