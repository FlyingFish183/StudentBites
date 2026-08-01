import { MealType } from '@prisma/client';

import { INutritionTargets } from '@src/common/utils/nutrition';

/******************************************************************************
                                Types
******************************************************************************/

export interface IDishLite {
  id: number;
  name: string;
  description?: string | null;
  mealTypes: MealType[];
  protein: number;
  carb: number;
  fat: number;
  kcal: number;
  estimatedCost: number;
}

export type IDayMenu = Partial<Record<MealType, IDishLite>>;

export interface IMenuTotals {
  cost: number;
  protein: number;
  carb: number;
  fat: number;
  kcal: number;
}

/******************************************************************************
                                Constants
******************************************************************************/

const MEAL_ORDER: MealType[] = [
  MealType.BREAKFAST,
  MealType.LUNCH,
  MealType.DINNER,
  MealType.SNACK,
];

// cho phép 1 bữa vượt ngân sách bữa tối đa 25% (miễn cả ngày không vượt)
const MEAL_BUDGET_FLEX = 1.25;
// số ứng viên tốt nhất để random (tạo sự đa dạng giữa các lần tạo)
const TOP_N = 3;

/******************************************************************************
                                Functions
******************************************************************************/

function dishesFor(dishes: IDishLite[], meal: MealType): IDishLite[] {
  return dishes.filter((d) => d.mealTypes.includes(meal));
}

function cheapest(dishes: IDishLite[]): IDishLite | undefined {
  return [...dishes].sort((a, b) => a.estimatedCost - b.estimatedCost)[0];
}

/**
 * Chọn thực đơn 1 ngày: đạt ngưỡng protein mục tiêu, tổng chi phí nằm trong
 * ngân sách ngày. Greedy theo từng bữa, ưu tiên hiệu suất protein/giá.
 */
export function pickMenuForDay(
  dishes: IDishLite[],
  targets: INutritionTargets,
  rng: () => number = Math.random,
  excludeDishIds: number[] = [],
): IDayMenu {
  const menu: IDayMenu = {};
  const pool = dishes.filter((d) => !excludeDishIds.includes(d.id));
  let remainingBudget = targets.dailyBudget;
  let proteinSoFar = 0;

  MEAL_ORDER.forEach((meal, idx) => {
    const candidatesAll = dishesFor(pool, meal).filter(
      (d) => !Object.values(menu).some((m) => m?.id === d.id),
    );
    if (candidatesAll.length === 0) return;

    // Chừa lại ngân sách tối thiểu cho các bữa còn lại
    const remainingMeals = MEAL_ORDER.slice(idx + 1);
    const reserve = remainingMeals.reduce((sum, m) => {
      const c = cheapest(dishesFor(pool, m));
      return sum + (c ? c.estimatedCost : 0);
    }, 0);
    const mealBudget = targets.mealBudgets[meal];
    const maxSpend = Math.min(
      mealBudget * MEAL_BUDGET_FLEX,
      remainingBudget - reserve,
    );

    let candidates = candidatesAll.filter((d) => d.estimatedCost <= maxSpend);
    if (candidates.length === 0) {
      // không món nào vừa túi -> lấy món rẻ nhất của bữa
      candidates = [cheapest(candidatesAll)!];
    }

    // Lượng protein trung bình còn cần cho mỗi bữa còn lại (kể cả bữa này)
    const mealsLeft = MEAL_ORDER.length - idx;
    const proteinNeeded = Math.max(
      0,
      (targets.proteinTarget - proteinSoFar) / mealsLeft,
    );

    // Điểm: đủ protein cần thiết là tốt nhất, sau đó tới hiệu suất protein/giá
    const scored = candidates
      .map((d) => {
        const proteinFit = -Math.abs(d.protein - proteinNeeded);
        const efficiency = (d.protein / Math.max(d.estimatedCost, 1)) * 1000;
        return { dish: d, score: proteinFit + efficiency };
      })
      .sort((a, b) => b.score - a.score);

    const top = scored.slice(0, TOP_N);
    const chosen = top[Math.floor(rng() * top.length)].dish;

    menu[meal] = chosen;
    remainingBudget -= chosen.estimatedCost;
    proteinSoFar += chosen.protein;
  });

  // Vòng cải thiện: nếu chưa đạt protein mục tiêu, nâng cấp dần từng bữa
  // sang món giàu protein hơn (chọn theo hiệu suất protein tăng thêm / chi
  // phí tăng thêm), miễn tổng ngày vẫn nằm trong ngân sách.
  let improved = true;
  while (proteinSoFar < targets.proteinTarget && improved) {
    improved = false;
    let best:
      | { meal: MealType, dish: IDishLite, gainPerCost: number }
      | undefined;
    for (const meal of MEAL_ORDER) {
      const cur = menu[meal];
      if (!cur) continue;
      const budgetForMeal = remainingBudget + cur.estimatedCost;
      const options = dishesFor(pool, meal).filter((d) =>
        d.protein > cur.protein &&
        d.estimatedCost <= budgetForMeal &&
        !Object.values(menu).some((m) => m?.id === d.id),
      );
      for (const d of options) {
        const gain = d.protein - cur.protein;
        const extra = Math.max(d.estimatedCost - cur.estimatedCost, 1);
        const gainPerCost = gain / extra;
        if (!best || gainPerCost > best.gainPerCost) {
          best = { meal, dish: d, gainPerCost };
        }
      }
    }
    if (best) {
      const cur = menu[best.meal]!;
      remainingBudget += cur.estimatedCost - best.dish.estimatedCost;
      proteinSoFar += best.dish.protein - cur.protein;
      menu[best.meal] = best.dish;
      improved = true;
    }
  }

  return menu;
}

/**
 * Tổng hợp dinh dưỡng + chi phí của thực đơn 1 ngày.
 */
export function calcMenuTotals(menu: IDayMenu): IMenuTotals {
  const items = Object.values(menu).filter((d): d is IDishLite => !!d);
  const round1 = (n: number) => Math.round(n * 10) / 10;
  return {
    cost: items.reduce((s, d) => s + d.estimatedCost, 0),
    protein: round1(items.reduce((s, d) => s + d.protein, 0)),
    carb: round1(items.reduce((s, d) => s + d.carb, 0)),
    fat: round1(items.reduce((s, d) => s + d.fat, 0)),
    kcal: Math.round(items.reduce((s, d) => s + d.kcal, 0)),
  };
}

/**
 * Tìm món thay thế cùng bữa, gần nhất về protein + chi phí.
 */
export function findAlternative(
  dishes: IDishLite[],
  meal: MealType,
  current: IDishLite,
  usedDishIds: number[],
  rng: () => number = Math.random,
): IDishLite | undefined {
  const candidates = dishesFor(dishes, meal).filter(
    (d) => d.id !== current.id && !usedDishIds.includes(d.id),
  );
  if (candidates.length === 0) return undefined;
  const scored = candidates
    .map((d) => ({
      dish: d,
      score:
        -Math.abs(d.protein - current.protein) * 2 -
        Math.abs(d.estimatedCost - current.estimatedCost) / 1000,
    }))
    .sort((a, b) => b.score - a.score);
  const top = scored.slice(0, TOP_N);
  return top[Math.floor(rng() * top.length)].dish;
}
