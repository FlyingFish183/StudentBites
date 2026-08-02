import { MealType } from '@prisma/client';

import { calcBmr, calcTargets } from '@src/common/utils/nutrition';
import {
  calcMenuTotals,
  findAlternative,
  IDishLite,
  pickMenuForDay,
} from '@src/services/planner-algorithm';

/******************************************************************************
                                Fixtures
******************************************************************************/

const { BREAKFAST, LUNCH, DINNER, SNACK } = MealType;

// Hồ sơ sinh viên nam điển hình: 68kg, 172cm, 21 tuổi, tập 3-5 buổi/tuần,
// mục tiêu tăng cơ, chu cấp 3 triệu/tháng
const PROFILE = {
  heightCm: 172,
  weightKg: 68,
  age: 21,
  gender: 'male',
  activityLevel: 'MODERATE',
  goal: 'GAIN_MUSCLE',
  monthlyBudget: 3000000,
} as const;

let nextId = 1;
function dish(
  name: string,
  mealTypes: MealType[],
  protein: number,
  cost: number,
): IDishLite {
  return {
    id: nextId++,
    name,
    mealTypes,
    protein,
    carb: 50,
    fat: 15,
    kcal: protein * 4 + 335,
    estimatedCost: cost,
  };
}

// bộ món tương tự dữ liệu seed (protein g / giá VND mỗi khẩu phần)
const DISHES: IDishLite[] = [
  dish('Bánh mì trứng', [BREAKFAST], 20, 12000),
  dish('Yến mạch sữa', [BREAKFAST], 18, 15000),
  dish('Mì gói trứng', [BREAKFAST, DINNER], 15, 9000),
  dish('Xôi đậu phộng', [BREAKFAST], 12, 8000),
  dish('Cơm ức gà', [LUNCH, DINNER], 50, 22000),
  dish('Cơm thịt băm', [LUNCH, DINNER], 30, 20000),
  dish('Cơm cá nục kho', [LUNCH, DINNER], 33, 18000),
  dish('Cơm đậu hũ', [LUNCH, DINNER], 23, 14000),
  dish('Cơm bò xào', [LUNCH, DINNER], 28, 32000),
  dish('Salad ức gà', [LUNCH, DINNER], 40, 21000),
  dish('Trứng luộc', [SNACK], 14, 7000),
  dish('Sữa chua chuối', [SNACK], 5, 10000),
  dish('Whey shake', [SNACK], 31, 18000),
];

/******************************************************************************
                                Tests
******************************************************************************/

describe('nutrition.calcBmr / calcTargets', () => {
  it('tính BMR đúng theo Mifflin-St Jeor (nam)', () => {
    // 10*68 + 6.25*172 - 5*21 + 5 = 680 + 1075 - 105 + 5 = 1655
    expect(calcBmr(PROFILE)).toBe(1655);
  });

  it('protein mục tiêu = 2g/kg khi tăng cơ', () => {
    const targets = calcTargets(PROFILE, new Date('2026-08-15'));
    expect(targets.proteinTarget).toBe(136); // 68 * 2.0
  });

  it('ngân sách ngày = ngân sách tháng / số ngày trong tháng', () => {
    const targets = calcTargets(PROFILE, new Date('2026-08-15'));
    expect(targets.dailyBudget).toBe(Math.floor(3000000 / 31)); // T8 có 31 ngày
    // tổng tỉ lệ chia bữa = 100%
    const sum = Object.values(targets.mealBudgets).reduce((a, b) => a + b, 0);
    expect(sum).toBeGreaterThan(targets.dailyBudget * 0.99);
    expect(sum).toBeLessThan(targets.dailyBudget * 1.01);
  });
});

describe('planner-algorithm.pickMenuForDay', () => {
  const targets = calcTargets(PROFILE, new Date('2026-08-15'));

  it('chọn đủ 4 bữa trong ngày', () => {
    const menu = pickMenuForDay(DISHES, targets, () => 0);
    expect(Object.keys(menu)).toHaveLength(4);
    expect(menu.BREAKFAST).toBeDefined();
    expect(menu.LUNCH).toBeDefined();
    expect(menu.DINNER).toBeDefined();
    expect(menu.SNACK).toBeDefined();
  });

  it('tổng chi phí không vượt ngân sách ngày', () => {
    // chạy 50 lần với random thật để chắc chắn ổn định
    for (let i = 0; i < 50; i++) {
      const menu = pickMenuForDay(DISHES, targets);
      const totals = calcMenuTotals(menu);
      expect(totals.cost).toBeLessThanOrEqual(targets.dailyBudget);
    }
  });

  it('đạt ít nhất 70% ngưỡng protein mục tiêu', () => {
    for (let i = 0; i < 50; i++) {
      const menu = pickMenuForDay(DISHES, targets);
      const totals = calcMenuTotals(menu);
      expect(totals.protein).toBeGreaterThanOrEqual(
        targets.proteinTarget * 0.7,
      );
    }
  });

  it('không chọn trùng món trong cùng 1 ngày', () => {
    const menu = pickMenuForDay(DISHES, targets);
    const ids = Object.values(menu).map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('planner-algorithm.findAlternative', () => {
  it('trả về món khác cùng bữa, không nằm trong danh sách đã dùng', () => {
    const current = DISHES.find((d) => d.name === 'Cơm ức gà')!;
    const used = [current.id];
    const alt = findAlternative(DISHES, LUNCH, current, used, () => 0);
    expect(alt).toBeDefined();
    expect(alt!.id).not.toBe(current.id);
    expect(alt!.mealTypes).toContain(LUNCH);
  });

  it('trả về undefined khi không còn món thay thế', () => {
    const only = [dish('Món duy nhất', [SNACK], 10, 5000)];
    const alt = findAlternative(only, SNACK, only[0], [only[0].id]);
    expect(alt).toBeUndefined();
  });
});
