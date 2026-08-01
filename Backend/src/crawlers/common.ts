import logger from 'jet-logger';

import prisma from '@src/repos/prisma';

/******************************************************************************
                                Types
******************************************************************************/

/** Sản phẩm thô lấy về từ website TMĐT. */
export interface IRawProduct {
  name: string;
  price: number; // VND
  url?: string;
}

export interface ICrawler {
  sourceSite: string; // trùng Store.sourceSite (bachhoaxanh|winmart|coopmart)
  crawl: () => Promise<IRawProduct[]>;
}

/******************************************************************************
                                Functions
******************************************************************************/

/**
 * Đọc khối lượng (gram) từ tên sản phẩm, vd "Ức gà phi lê 500g", "Gạo 5kg",
 * "Sữa 1 lít". Mặc định 1000g nếu không tìm thấy.
 */
export function parseWeightGrams(name: string): number {
  const lower = name.toLowerCase();
  const kg = /([\d.,]+)\s*(?:kg|kí|ký)/.exec(lower);
  if (kg) return parseFloat(kg[1].replace(',', '.')) * 1000;
  const g = /([\d.,]+)\s*(?:g|gr|gam)\b/.exec(lower);
  if (g) return parseFloat(g[1].replace(',', '.'));
  const liter = /([\d.,]+)\s*(?:l|lít|lit)\b/.exec(lower);
  if (liter) return parseFloat(liter[1].replace(',', '.')) * 1000;
  const ml = /([\d.,]+)\s*ml\b/.exec(lower);
  if (ml) return parseFloat(ml[1].replace(',', '.'));
  const dozen = /(?:vỉ|hộp)\s*(\d+)\s*(?:quả|trứng)/.exec(lower);
  if (dozen) return parseInt(dozen[1], 10) * 55; // 1 trứng ~55g
  return 1000;
}

/**
 * Map sản phẩm crawl được vào bảng Ingredient bằng keywords, rồi upsert giá.
 * Trả về số sản phẩm match được.
 */
export async function saveProducts(
  sourceSite: string,
  products: IRawProduct[],
): Promise<number> {
  if (products.length === 0) return 0;

  const store = await prisma.store.findFirst({ where: { sourceSite } });
  if (!store) {
    logger.warn(`Không tìm thấy store cho nguồn ${sourceSite}, bỏ qua`);
    return 0;
  }
  const ingredients = await prisma.ingredient.findMany();
  let matched = 0;

  for (const product of products) {
    if (!product.name || !Number.isFinite(product.price)) continue;
    const nameLower = product.name.toLowerCase();
    // ưu tiên keyword dài nhất khớp được (cụ thể hơn)
    let best: { id: number; kwLen: number } | null = null;
    for (const ing of ingredients) {
      for (const kw of ing.keywords) {
        if (nameLower.includes(kw.toLowerCase())) {
          if (!best || kw.length > best.kwLen) {
            best = { id: ing.id, kwLen: kw.length };
          }
        }
      }
    }
    if (!best) continue;

    const unitQty = parseWeightGrams(product.name);
    await prisma.ingredientPrice.upsert({
      where: {
        ingredientId_storeId_productName: {
          ingredientId: best.id,
          storeId: store.id,
          productName: product.name,
        },
      },
      update: {
        price: Math.round(product.price),
        unitQty,
        pricePerUnit: product.price / unitQty,
        productUrl: product.url,
        crawledAt: new Date(),
      },
      create: {
        ingredientId: best.id,
        storeId: store.id,
        productName: product.name,
        price: Math.round(product.price),
        unitQty,
        pricePerUnit: product.price / unitQty,
        productUrl: product.url,
      },
    });
    matched++;
  }
  return matched;
}

/**
 * Parse chuỗi giá tiếng Việt: "45.500đ", "45,500 ₫" -> 45500.
 */
export function parsePriceVnd(text: string): number {
  const digits = text.replace(/[^\d]/g, '');
  return digits ? parseInt(digits, 10) : NaN;
}
