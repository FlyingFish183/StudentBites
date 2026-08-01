/**
 * Seed data cho StudentBites: nguyên liệu, giá tham khảo (3 nguồn online),
 * và các món ăn sinh viên dễ nấu.
 *
 * Chạy: npm run db:seed
 */
import { MealType, PrismaClient, StoreType } from '@prisma/client';

const prisma = new PrismaClient();

/******************************************************************************
                              Ingredients
******************************************************************************/

interface IngredientSeed {
  name: string;
  category: string;
  protein: number; // per 100g
  carb: number;
  fat: number;
  kcal: number;
  basePricePerKg: number; // VND, giá tham khảo
  keywords: string[];
}

const INGREDIENTS: IngredientSeed[] = [
  // --- Protein ---
  { name: 'Trứng gà', category: 'protein', protein: 13, carb: 1.1, fat: 11, kcal: 155, basePricePerKg: 35000, keywords: ['trứng gà', 'trứng'] },
  { name: 'Ức gà', category: 'protein', protein: 31, carb: 0, fat: 3.6, kcal: 165, basePricePerKg: 75000, keywords: ['ức gà', 'ức gà phi lê', 'gà phi lê'] },
  { name: 'Đùi gà', category: 'protein', protein: 26, carb: 0, fat: 8, kcal: 209, basePricePerKg: 58000, keywords: ['đùi gà', 'má đùi'] },
  { name: 'Thịt heo nạc', category: 'protein', protein: 27, carb: 0, fat: 14, kcal: 242, basePricePerKg: 115000, keywords: ['thịt heo', 'nạc heo', 'thịt nạc'] },
  { name: 'Thịt heo băm', category: 'protein', protein: 25, carb: 0, fat: 17, kcal: 263, basePricePerKg: 105000, keywords: ['heo xay', 'thịt xay', 'heo băm'] },
  { name: 'Thịt bò', category: 'protein', protein: 26, carb: 0, fat: 15, kcal: 250, basePricePerKg: 255000, keywords: ['thịt bò', 'bò úc', 'nạc bò'] },
  { name: 'Cá basa', category: 'protein', protein: 13, carb: 0, fat: 8, kcal: 126, basePricePerKg: 62000, keywords: ['cá basa', 'basa phi lê'] },
  { name: 'Cá nục', category: 'protein', protein: 20, carb: 0, fat: 5, kcal: 130, basePricePerKg: 52000, keywords: ['cá nục'] },
  { name: 'Tôm', category: 'protein', protein: 24, carb: 0.2, fat: 0.3, kcal: 99, basePricePerKg: 185000, keywords: ['tôm thẻ', 'tôm sú', 'tôm'] },
  { name: 'Đậu hũ', category: 'protein', protein: 8, carb: 1.9, fat: 4.8, kcal: 76, basePricePerKg: 22000, keywords: ['đậu hũ', 'tàu hũ', 'đậu phụ'] },
  { name: 'Whey protein', category: 'protein', protein: 80, carb: 8, fat: 6, kcal: 400, basePricePerKg: 750000, keywords: ['whey', 'bột protein'] },
  // --- Carb ---
  { name: 'Gạo trắng', category: 'carb', protein: 7, carb: 80, fat: 0.6, kcal: 360, basePricePerKg: 21000, keywords: ['gạo'] },
  { name: 'Bún tươi', category: 'carb', protein: 1.7, carb: 25, fat: 0, kcal: 110, basePricePerKg: 16000, keywords: ['bún tươi', 'bún'] },
  { name: 'Bánh mì', category: 'carb', protein: 9, carb: 49, fat: 3, kcal: 265, basePricePerKg: 22000, keywords: ['bánh mì'] },
  { name: 'Yến mạch', category: 'carb', protein: 17, carb: 66, fat: 7, kcal: 389, basePricePerKg: 72000, keywords: ['yến mạch', 'oats'] },
  { name: 'Khoai lang', category: 'carb', protein: 1.6, carb: 20, fat: 0.1, kcal: 86, basePricePerKg: 16000, keywords: ['khoai lang'] },
  { name: 'Mì gói', category: 'carb', protein: 9, carb: 60, fat: 17, kcal: 440, basePricePerKg: 55000, keywords: ['mì gói', 'mì ăn liền', 'mì tôm'] },
  // --- Sữa & khác ---
  { name: 'Sữa tươi', category: 'sữa', protein: 3.4, carb: 5, fat: 3.6, kcal: 64, basePricePerKg: 33000, keywords: ['sữa tươi', 'sữa tiệt trùng'] },
  { name: 'Sữa chua', category: 'sữa', protein: 3.5, carb: 12, fat: 3, kcal: 90, basePricePerKg: 55000, keywords: ['sữa chua'] },
  { name: 'Đậu phộng', category: 'hạt', protein: 26, carb: 16, fat: 49, kcal: 567, basePricePerKg: 62000, keywords: ['đậu phộng', 'lạc'] },
  { name: 'Chuối', category: 'trái cây', protein: 1.1, carb: 23, fat: 0.3, kcal: 89, basePricePerKg: 26000, keywords: ['chuối'] },
  // --- Rau củ ---
  { name: 'Rau muống', category: 'rau củ', protein: 2.6, carb: 3.1, fat: 0.2, kcal: 19, basePricePerKg: 16000, keywords: ['rau muống'] },
  { name: 'Cải xanh', category: 'rau củ', protein: 1.5, carb: 2.2, fat: 0.2, kcal: 13, basePricePerKg: 18000, keywords: ['cải xanh', 'cải ngọt', 'cải thìa'] },
  { name: 'Cà chua', category: 'rau củ', protein: 0.9, carb: 3.9, fat: 0.2, kcal: 18, basePricePerKg: 26000, keywords: ['cà chua'] },
  { name: 'Dưa leo', category: 'rau củ', protein: 0.7, carb: 3.6, fat: 0.1, kcal: 15, basePricePerKg: 19000, keywords: ['dưa leo', 'dưa chuột'] },
  { name: 'Bắp cải', category: 'rau củ', protein: 1.3, carb: 6, fat: 0.1, kcal: 25, basePricePerKg: 13000, keywords: ['bắp cải'] },
  { name: 'Cà rốt', category: 'rau củ', protein: 0.9, carb: 10, fat: 0.2, kcal: 41, basePricePerKg: 19000, keywords: ['cà rốt'] },
  // --- Gia vị / dầu ---
  { name: 'Dầu ăn', category: 'gia vị', protein: 0, carb: 0, fat: 100, kcal: 884, basePricePerKg: 52000, keywords: ['dầu ăn', 'dầu thực vật'] },
];

/******************************************************************************
                          Stores (nguồn giá online)
******************************************************************************/

// factor: chênh lệch giá tương đối giữa các nguồn (dữ liệu seed ban đầu,
// crawler sẽ cập nhật giá thật sau)
const ONLINE_STORES = [
  { name: 'Bách Hóa Xanh (Online)', sourceSite: 'bachhoaxanh', factor: 1.0 },
  { name: 'WinMart (Online)', sourceSite: 'winmart', factor: 1.06 },
  { name: 'Co.op Online', sourceSite: 'coopmart', factor: 0.97 },
] as const;

/******************************************************************************
                                Dishes
******************************************************************************/

interface DishSeed {
  name: string;
  description: string;
  mealTypes: MealType[];
  // [tên nguyên liệu, số gram cho 1 khẩu phần]
  ingredients: [string, number][];
}

const { BREAKFAST, LUNCH, DINNER, SNACK } = MealType;

const DISHES: DishSeed[] = [
  // --- Bữa sáng ---
  { name: 'Bánh mì trứng ốp la', description: 'Bánh mì kẹp 2 trứng ốp la, nhanh gọn giàu protein.', mealTypes: [BREAKFAST], ingredients: [['Bánh mì', 90], ['Trứng gà', 110], ['Dầu ăn', 5], ['Dưa leo', 30]] },
  { name: 'Yến mạch sữa chuối', description: 'Yến mạch ngâm sữa tươi với chuối, không cần nấu.', mealTypes: [BREAKFAST], ingredients: [['Yến mạch', 60], ['Sữa tươi', 200], ['Chuối', 100]] },
  { name: 'Bánh mì thịt băm', description: 'Bánh mì kẹp thịt heo băm xào hành.', mealTypes: [BREAKFAST], ingredients: [['Bánh mì', 90], ['Thịt heo băm', 60], ['Dưa leo', 30], ['Dầu ăn', 5]] },
  { name: 'Mì gói trứng cải', description: 'Mì gói nâng cấp thêm trứng và rau cải.', mealTypes: [BREAKFAST, DINNER], ingredients: [['Mì gói', 75], ['Trứng gà', 55], ['Cải xanh', 60]] },
  { name: 'Xôi đậu phộng', description: 'Xôi nếp đậu phộng chắc bụng buổi sáng.', mealTypes: [BREAKFAST], ingredients: [['Gạo trắng', 100], ['Đậu phộng', 30]] },
  { name: 'Trứng luộc + sữa tươi', description: '2 trứng luộc và 1 ly sữa, chuẩn bị 5 phút.', mealTypes: [BREAKFAST, SNACK], ingredients: [['Trứng gà', 110], ['Sữa tươi', 180]] },
  // --- Bữa trưa / tối ---
  { name: 'Cơm ức gà áp chảo', description: 'Ức gà áp chảo, cơm trắng và rau muống xào tỏi.', mealTypes: [LUNCH, DINNER], ingredients: [['Gạo trắng', 100], ['Ức gà', 150], ['Rau muống', 100], ['Dầu ăn', 7]] },
  { name: 'Cơm thịt băm sốt cà', description: 'Thịt heo băm sốt cà chua đưa cơm.', mealTypes: [LUNCH, DINNER], ingredients: [['Gạo trắng', 100], ['Thịt heo băm', 100], ['Cà chua', 80], ['Dầu ăn', 7]] },
  { name: 'Cơm cá nục kho', description: 'Cá nục kho tiêu, món rẻ giàu protein.', mealTypes: [LUNCH, DINNER], ingredients: [['Gạo trắng', 100], ['Cá nục', 150], ['Dầu ăn', 5], ['Dưa leo', 50]] },
  { name: 'Cơm đậu hũ sốt cà', description: 'Đậu hũ sốt cà chua, lựa chọn tiết kiệm.', mealTypes: [LUNCH, DINNER], ingredients: [['Gạo trắng', 100], ['Đậu hũ', 200], ['Cà chua', 80], ['Dầu ăn', 7]] },
  { name: 'Cơm bò xào cải', description: 'Thịt bò xào cải xanh, bữa sang cuối tuần.', mealTypes: [LUNCH, DINNER], ingredients: [['Gạo trắng', 100], ['Thịt bò', 80], ['Cải xanh', 100], ['Dầu ăn', 7]] },
  { name: 'Cơm đùi gà kho', description: 'Đùi gà kho gừng với bắp cải luộc.', mealTypes: [LUNCH, DINNER], ingredients: [['Gạo trắng', 100], ['Đùi gà', 150], ['Bắp cải', 100]] },
  { name: 'Bún đậu hũ trứng', description: 'Bún tươi với đậu hũ chiên và trứng luộc.', mealTypes: [LUNCH, DINNER], ingredients: [['Bún tươi', 200], ['Đậu hũ', 150], ['Trứng gà', 55], ['Dầu ăn', 7]] },
  { name: 'Cơm tôm rim', description: 'Tôm rim mặn ngọt với dưa leo.', mealTypes: [LUNCH, DINNER], ingredients: [['Gạo trắng', 100], ['Tôm', 100], ['Dưa leo', 50], ['Dầu ăn', 5]] },
  { name: 'Cơm trứng chiên thịt băm', description: 'Trứng chiên thịt băm, món quốc dân sinh viên.', mealTypes: [LUNCH, DINNER], ingredients: [['Gạo trắng', 100], ['Trứng gà', 110], ['Thịt heo băm', 50], ['Dầu ăn', 7]] },
  { name: 'Cơm cá basa kho', description: 'Cá basa kho tộ béo ngậy.', mealTypes: [LUNCH, DINNER], ingredients: [['Gạo trắng', 100], ['Cá basa', 150], ['Dầu ăn', 5], ['Cà chua', 50]] },
  { name: 'Salad ức gà', description: 'Salad rau củ với ức gà, ít carb cho buổi tối.', mealTypes: [LUNCH, DINNER], ingredients: [['Ức gà', 120], ['Bắp cải', 80], ['Cà chua', 60], ['Dưa leo', 60], ['Dầu ăn', 10]] },
  { name: 'Khoai lang + ức gà luộc', description: 'Combo gymer kinh điển, no lâu.', mealTypes: [LUNCH, DINNER], ingredients: [['Khoai lang', 200], ['Ức gà', 150]] },
  { name: 'Cháo thịt băm cà rốt', description: 'Cháo thịt băm dễ ăn, hợp bữa tối nhẹ.', mealTypes: [DINNER, BREAKFAST], ingredients: [['Gạo trắng', 60], ['Thịt heo băm', 80], ['Cà rốt', 50]] },
  { name: 'Cơm gà xé bắp cải', description: 'Đùi gà luộc xé trộn bắp cải giòn.', mealTypes: [LUNCH, DINNER], ingredients: [['Gạo trắng', 100], ['Đùi gà', 130], ['Bắp cải', 100], ['Cà rốt', 30]] },
  // --- Bữa phụ ---
  { name: 'Sữa chua chuối', description: 'Sữa chua trộn chuối cắt lát.', mealTypes: [SNACK], ingredients: [['Sữa chua', 100], ['Chuối', 100]] },
  { name: 'Đậu phộng rang', description: 'Một nắm đậu phộng rang giàu năng lượng.', mealTypes: [SNACK], ingredients: [['Đậu phộng', 40]] },
  { name: 'Trứng luộc (2 quả)', description: 'Snack protein rẻ nhất có thể.', mealTypes: [SNACK], ingredients: [['Trứng gà', 110]] },
  { name: 'Chuối (2 trái)', description: 'Carb nhanh trước/sau buổi tập.', mealTypes: [SNACK], ingredients: [['Chuối', 200]] },
  { name: 'Khoai lang luộc', description: 'Củ khoai luộc no lâu, giá rẻ.', mealTypes: [SNACK], ingredients: [['Khoai lang', 250]] },
  { name: 'Whey shake', description: '1 scoop whey pha với sữa tươi, sau buổi tập.', mealTypes: [SNACK], ingredients: [['Whey protein', 30], ['Sữa tươi', 200]] },
];

/******************************************************************************
                                Run seed
******************************************************************************/

async function main() {
  // 1) Ingredients
  const ingredientByName = new Map<string, { id: number; seed: IngredientSeed }>();
  for (const ing of INGREDIENTS) {
    const row = await prisma.ingredient.upsert({
      where: { name: ing.name },
      update: {
        category: ing.category,
        proteinPer100g: ing.protein,
        carbPer100g: ing.carb,
        fatPer100g: ing.fat,
        kcalPer100g: ing.kcal,
        keywords: ing.keywords,
      },
      create: {
        name: ing.name,
        category: ing.category,
        proteinPer100g: ing.protein,
        carbPer100g: ing.carb,
        fatPer100g: ing.fat,
        kcalPer100g: ing.kcal,
        keywords: ing.keywords,
      },
    });
    ingredientByName.set(ing.name, { id: row.id, seed: ing });
  }

  // 2) Online stores + seed prices
  for (const store of ONLINE_STORES) {
    const storeRow = await prisma.store.upsert({
      where: { osmId: `online-${store.sourceSite}` },
      update: { name: store.name },
      create: {
        name: store.name,
        type: StoreType.ONLINE,
        sourceSite: store.sourceSite,
        osmId: `online-${store.sourceSite}`,
      },
    });
    for (const ing of INGREDIENTS) {
      const { id } = ingredientByName.get(ing.name)!;
      const price = Math.round((ing.basePricePerKg * store.factor) / 500) * 500;
      const productName = `${ing.name} 1kg (giá tham khảo)`;
      await prisma.ingredientPrice.upsert({
        where: {
          ingredientId_storeId_productName: {
            ingredientId: id,
            storeId: storeRow.id,
            productName,
          },
        },
        update: { price, unitQty: 1000, pricePerUnit: price / 1000 },
        create: {
          ingredientId: id,
          storeId: storeRow.id,
          productName,
          price,
          unitQty: 1000,
          pricePerUnit: price / 1000,
        },
      });
    }
  }

  // 3) Dishes (macro + giá tính từ nguyên liệu, +15% phụ phí gia vị)
  for (const dish of DISHES) {
    let protein = 0, carb = 0, fat = 0, kcal = 0, cost = 0;
    for (const [ingName, grams] of dish.ingredients) {
      const found = ingredientByName.get(ingName);
      if (!found) throw new Error(`Ingredient not found: ${ingName}`);
      const { seed } = found;
      protein += (seed.protein * grams) / 100;
      carb += (seed.carb * grams) / 100;
      fat += (seed.fat * grams) / 100;
      kcal += (seed.kcal * grams) / 100;
      cost += (seed.basePricePerKg / 1000) * grams;
    }
    const estimatedCost = Math.round((cost * 1.15) / 500) * 500;
    const round1 = (n: number) => Math.round(n * 10) / 10;
    const dishRow = await prisma.dish.upsert({
      where: { name: dish.name },
      update: {
        description: dish.description,
        mealTypes: dish.mealTypes,
        protein: round1(protein),
        carb: round1(carb),
        fat: round1(fat),
        kcal: Math.round(kcal),
        estimatedCost,
      },
      create: {
        name: dish.name,
        description: dish.description,
        mealTypes: dish.mealTypes,
        protein: round1(protein),
        carb: round1(carb),
        fat: round1(fat),
        kcal: Math.round(kcal),
        estimatedCost,
      },
    });
    for (const [ingName, grams] of dish.ingredients) {
      const { id: ingredientId } = ingredientByName.get(ingName)!;
      await prisma.dishIngredient.upsert({
        where: {
          dishId_ingredientId: { dishId: dishRow.id, ingredientId },
        },
        update: { amountGrams: grams },
        create: { dishId: dishRow.id, ingredientId, amountGrams: grams },
      });
    }
  }

  const counts = {
    ingredients: await prisma.ingredient.count(),
    stores: await prisma.store.count(),
    prices: await prisma.ingredientPrice.count(),
    dishes: await prisma.dish.count(),
  };
  // eslint-disable-next-line no-console
  console.log('Seed done:', counts);
}

main()
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
