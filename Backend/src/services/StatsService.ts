import prisma from '@src/repos/prisma';

import { formatDateOnly, parseDateOnly } from './PlannerService';
import ProfileService from './ProfileService';

/******************************************************************************
                                Functions
******************************************************************************/

/**
 * Tổng hợp dinh dưỡng 1 ngày so với mục tiêu (FR-4.1, FR-4.3).
 */
async function daily(userId: number, dateStr: string) {
  const targets = await ProfileService.getTargets(userId);
  const date = parseDateOnly(dateStr);
  const logs = await prisma.mealLog.findMany({ where: { userId, date } });
  const round1 = (n: number) => Math.round(n * 10) / 10;
  const consumed = {
    protein: round1(logs.reduce((s, l) => s + l.protein, 0)),
    carb: round1(logs.reduce((s, l) => s + l.carb, 0)),
    fat: round1(logs.reduce((s, l) => s + l.fat, 0)),
    kcal: Math.round(logs.reduce((s, l) => s + l.kcal, 0)),
    cost: logs.reduce((s, l) => s + l.cost, 0),
  };
  return {
    date: dateStr,
    targets,
    consumed,
    proteinWarning: consumed.protein < targets.proteinTarget * 0.9,
    budgetWarning: consumed.cost > targets.dailyBudget,
  };
}

/**
 * Thống kê chi tiêu thực tế vs ngân sách theo tuần/tháng (FR-3.4).
 */
async function spending(
  userId: number,
  range: 'week' | 'month',
  endDateStr: string,
) {
  const targets = await ProfileService.getTargets(userId);
  const end = parseDateOnly(endDateStr);
  const numDays = range === 'week' ? 7 : 30;
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - (numDays - 1));

  const logs = await prisma.mealLog.findMany({
    where: { userId, date: { gte: start, lte: end } },
  });
  const costByDay = new Map<string, number>();
  for (const log of logs) {
    const key = formatDateOnly(log.date);
    costByDay.set(key, (costByDay.get(key) ?? 0) + log.cost);
  }

  const days: { date: string; spent: number; budget: number }[] = [];
  for (let i = 0; i < numDays; i++) {
    const d = new Date(start);
    d.setUTCDate(d.getUTCDate() + i);
    const key = formatDateOnly(d);
    days.push({
      date: key,
      spent: costByDay.get(key) ?? 0,
      budget: targets.dailyBudget,
    });
  }
  const totalSpent = days.reduce((s, d) => s + d.spent, 0);
  return {
    range,
    days,
    totalSpent,
    totalBudget: targets.dailyBudget * numDays,
  };
}

/******************************************************************************
                            Export default
******************************************************************************/

export default {
  daily,
  spending,
} as const;
