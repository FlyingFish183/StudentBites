// Kiểu dữ liệu dùng chung, khớp với response của Backend API

export type MealType = "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK";
export type ActivityLevel =
  | "SEDENTARY"
  | "LIGHT"
  | "MODERATE"
  | "ACTIVE"
  | "VERY_ACTIVE";
export type Goal = "GAIN_MUSCLE" | "LOSE_FAT" | "MAINTAIN";

export const MEAL_LABELS: Record<MealType, string> = {
  BREAKFAST: "Bữa sáng",
  LUNCH: "Bữa trưa",
  DINNER: "Bữa tối",
  SNACK: "Bữa phụ",
};

export const MEAL_ORDER: MealType[] = [
  "BREAKFAST",
  "LUNCH",
  "DINNER",
  "SNACK",
];

export const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  SEDENTARY: "Ít vận động (ngồi nhiều)",
  LIGHT: "Nhẹ (1-3 buổi/tuần)",
  MODERATE: "Vừa (3-5 buổi/tuần)",
  ACTIVE: "Nhiều (6-7 buổi/tuần)",
  VERY_ACTIVE: "Rất nhiều (VĐV, lao động nặng)",
};

export const GOAL_LABELS: Record<Goal, string> = {
  GAIN_MUSCLE: "Tăng cơ",
  LOSE_FAT: "Giảm mỡ",
  MAINTAIN: "Giữ cân",
};

export const GOAL_HINTS: Record<Goal, string> = {
  GAIN_MUSCLE: "Protein 2g/kg, dư khoảng 300 kcal mỗi ngày",
  LOSE_FAT: "Protein 2.2g/kg, hụt khoảng 300 kcal mỗi ngày",
  MAINTAIN: "Protein 1.6g/kg, giữ nguyên mức calo",
};

export interface IUser {
  id: number;
  email: string;
  name: string;
}

export interface IProfile {
  heightCm: number;
  weightKg: number;
  age: number;
  gender: string;
  activityLevel: ActivityLevel;
  goal: Goal;
  monthlyBudget: number;
}

export interface ITargets {
  kcalTarget: number;
  proteinTarget: number;
  carbTarget: number;
  fatTarget: number;
  dailyBudget: number;
  mealBudgets: Record<MealType, number>;
}

export interface IDish {
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

export interface IPlanItem {
  id: number;
  mealType: MealType;
  dish: IDish;
  estimatedCost: number;
}

export interface IDayPlan {
  date: string;
  items: IPlanItem[];
  totals: { cost: number; protein: number; carb: number; fat: number; kcal: number };
  budgetStatus: {
    dailyBudget: number;
    totalCost: number;
    overBudget: boolean;
    diff: number;
  };
}

export interface IDailyStats {
  date: string;
  targets: ITargets;
  consumed: { protein: number; carb: number; fat: number; kcal: number; cost: number };
  proteinWarning: boolean;
  budgetWarning: boolean;
}

export interface ISpendingStats {
  range: "week" | "month";
  days: { date: string; spent: number; budget: number }[];
  totalSpent: number;
  totalBudget: number;
}

export interface IMonthDay {
  date: string;
  protein: number;
  kcal: number;
  cost: number;
  meals: number;
}

export interface IDayLog {
  id: number;
  mealType: MealType;
  name: string;
  protein: number;
  carb: number;
  fat: number;
  kcal: number;
  cost: number;
  eatenAt: string;
}

export type StoreType = "MARKET" | "SUPERMARKET" | "CONVENIENCE" | "ONLINE";

export const STORE_TYPE_LABELS: Record<StoreType, string> = {
  MARKET: "Chợ",
  SUPERMARKET: "Siêu thị",
  CONVENIENCE: "Tiện lợi",
  ONLINE: "Online",
};

export interface IStore {
  id: number;
  name: string;
  type: StoreType;
  address: string | null;
  lat: number;
  lng: number;
  distanceM: number;
}

export interface IGeocodeResult {
  lat: number;
  lng: number;
  label: string;
}

export interface IPriceOffer {
  storeId: number;
  storeName: string;
  sourceSite: string | null;
  productName: string;
  productUrl: string | null;
  estimatedCost: number;
  pricePer100g: number;
  crawledAt: string;
  /** true = giá seed dự phòng, chưa phải giá crawl */
  isReference?: boolean;
}

/** Chào giá khi tìm nguyên liệu (So giá) — không gắn lượng thực đơn. */
export interface ISearchOffer {
  storeId: number;
  storeName: string;
  sourceSite: string | null;
  productName: string;
  productUrl: string | null;
  currentPrice: number | null;
  rawUnit: string | null;
  pricePer100g: number;
  crawledAt: string;
  isReference?: boolean;
}

export interface IPriceSearchResult {
  query: string;
  items: {
    ingredientId: number;
    name: string;
    category: string;
    bestOffer: ISearchOffer | null;
    offers: ISearchOffer[];
  }[];
}

export interface ICompareResult {
  date: string;
  items: {
    ingredientId: number;
    name: string;
    grams: number;
    bestOffer: IPriceOffer | null;
    offers: IPriceOffer[];
  }[];
  storeTotals: {
    storeId: number;
    storeName: string;
    sourceSite: string | null;
    total: number;
    itemCount: number;
  }[];
  bestTotal: number;
}

export interface IIngredient {
  id: number;
  name: string;
  category: string;
}

export interface IPriceAlert {
  id: number;
  ingredientId: number;
  ingredientName: string;
  thresholdPct: number;
  isActive: boolean;
}

export interface INotification {
  id: number;
  type: string;
  title: string;
  payload: {
    ingredientId: number;
    ingredientName: string;
    productName: string;
    store: string;
    oldPrice: number;
    newPrice: number;
    dropPct: number;
  };
  readAt: string | null;
  createdAt: string;
}
