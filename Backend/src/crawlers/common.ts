import { MatchSource, Prisma } from '@prisma/client';
import logger from 'jet-logger';

import prisma from '@src/repos/prisma';

/******************************************************************************
                                Types
******************************************************************************/

/** Sản phẩm thô lấy về từ một sàn. */
export interface IRawProduct {
  /** Mã trên sàn. Không có thì để trống, saveProducts tự sinh từ tên. */
  sku?: string;
  name: string;
  price: number; // VND
  url?: string;
  imageUrl?: string;
  /** Chuỗi đơn vị thô đọc được: "300g", "0.5KG", "Gói" */
  rawUnit?: string;
  inStock?: boolean;
  /** Phần dữ liệu riêng của từng sàn: khuyến mãi, thương hiệu, mã kho… */
  metadata?: Prisma.InputJsonValue;
  /** Đường dẫn danh mục đã tìm thấy sản phẩm, khớp StoreCategory.path */
  categoryPath?: string;
}

export interface ICrawler {
  sourceSite: string; // trùng Store.code (bachhoaxanh|winmart|coopmart)
  crawl: () => Promise<IRawProduct[]>;
}

export interface ISaveResult {
  /** Số sản phẩm đã ghi vào bảng Product */
  saved: number;
  /** Số sản phẩm map được về một Ingredient */
  matched: number;
  /** Số sản phẩm có giá hoặc tình trạng còn hàng khác lần trước */
  priceChanged: number;
  /** Số sản phẩm không đọc được khối lượng nên không so giá được */
  noWeight: number;
}

/******************************************************************************
                                Functions
******************************************************************************/

/**
 * Đọc khối lượng (gram) từ tên hoặc đơn vị sản phẩm.
 *
 * Trả về `null` khi không đọc được — CỐ Ý không đoán 1kg như bản trước. Đoán
 * sai làm giá mỗi gram lệch nhiều lần: một bó rau 300g giá 12.000₫ mà tính
 * thành 1kg thì ra 12₫/100g thay vì 40₫/100g, và màn so giá sẽ khuyên sai.
 * Sót một sản phẩm còn hơn báo sai giá.
 */
export function parseWeightGrams(text: string): number | null {
  const lower = text.toLowerCase();
  const kg = /([\d.,]+)\s*(?:kg|kí|ký)/.exec(lower);
  if (kg) return Math.round(parseFloat(kg[1].replace(',', '.')) * 1000);
  const g = /([\d.,]+)\s*(?:g|gr|gam)\b/.exec(lower);
  if (g) return Math.round(parseFloat(g[1].replace(',', '.')));
  const liter = /([\d.,]+)\s*(?:l|lít|lit)\b/.exec(lower);
  if (liter) return Math.round(parseFloat(liter[1].replace(',', '.')) * 1000);
  const ml = /([\d.,]+)\s*ml\b/.exec(lower);
  if (ml) return Math.round(parseFloat(ml[1].replace(',', '.')));
  const dozen = /(?:vỉ|hộp)\s*(\d+)\s*(?:quả|trứng)/.exec(lower);
  if (dozen) return parseInt(dozen[1], 10) * 55; // 1 trứng ~55g
  return null;
}

/**
 * Parse chuỗi giá tiếng Việt: "45.500đ", "45,500 ₫" -> 45500.
 */
export function parsePriceVnd(text: string): number {
  const digits = text.replace(/[^\d]/g, '');
  return digits ? parseInt(digits, 10) : NaN;
}

/** Sinh sku ổn định từ tên khi sàn không cho mã. */
function slugSku(name: string): string {
  return (
    'name-' +
    name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 80)
  );
}

/**
 * Tìm nguyên liệu khớp tên sản phẩm, ưu tiên keyword DÀI NHẤT.
 *
 * "Ức gà phi lê 500g" khớp cả "gà phi lê" lẫn "ức gà phi lê"; lấy chuỗi dài
 * hơn cho kết quả cụ thể hơn.
 */
function matchIngredient(
  productName: string,
  ingredients: { id: number; keywords: string[] }[],
): { id: number; keyword: string } | null {
  const lower = productName.toLowerCase();
  let best: { id: number; keyword: string } | null = null;
  for (const ing of ingredients) {
    for (const kw of ing.keywords) {
      if (lower.includes(kw.toLowerCase())) {
        if (!best || kw.length > best.keyword.length) {
          best = { id: ing.id, keyword: kw };
        }
      }
    }
  }
  return best;
}

/**
 * Lưu sản phẩm crawl được vào bảng Product, kèm map về Ingredient và ghi lịch
 * sử giá khi có thay đổi.
 *
 * Sản phẩm đã được người sửa tay (`matchSource = MANUAL`) thì KHÔNG bị lượt
 * crawl sau map đè lên.
 */
export async function saveProducts(
  sourceSite: string,
  products: IRawProduct[],
  crawlRunId?: number,
): Promise<ISaveResult> {
  const result: ISaveResult = {
    saved: 0,
    matched: 0,
    priceChanged: 0,
    noWeight: 0,
  };
  if (products.length === 0) return result;

  const store = await prisma.store.findUnique({ where: { code: sourceSite } });
  if (!store) {
    logger.warn(`Không tìm thấy Store có code "${sourceSite}", bỏ qua`);
    return result;
  }

  const ingredients = await prisma.ingredient.findMany({
    select: { id: true, keywords: true },
  });
  const categories = await prisma.storeCategory.findMany({
    where: { storeId: store.id },
    select: { id: true, path: true },
  });
  const categoryByPath = new Map(categories.map((c) => [c.path, c.id]));

  for (const raw of products) {
    if (!raw.name || !Number.isFinite(raw.price)) continue;

    const sku = raw.sku?.trim() || slugSku(raw.name);
    const grams = parseWeightGrams(`${raw.name} ${raw.rawUnit ?? ''}`);
    if (grams === null) result.noWeight++;

    const price = new Prisma.Decimal(Math.round(raw.price));
    const pricePerGram =
      grams && grams > 0 ? price.dividedBy(grams).toDecimalPlaces(4) : null;
    const isInStock = raw.inStock ?? true;

    const existing = await prisma.product.findUnique({
      where: { storeId_sku: { storeId: store.id, sku } },
      select: {
        id: true,
        currentPrice: true,
        isInStock: true,
        matchSource: true,
      },
    });

    // Người đã sửa tay thì giữ nguyên liên kết nguyên liệu.
    const keepManual = existing?.matchSource === MatchSource.MANUAL;
    const match = keepManual ? null : matchIngredient(raw.name, ingredients);
    if (match) result.matched++;

    const data = {
      storeId: store.id,
      storeCategoryId: raw.categoryPath
        ? (categoryByPath.get(raw.categoryPath) ?? null)
        : null,
      sku,
      name: raw.name,
      url: raw.url ?? null,
      imageUrl: raw.imageUrl ?? null,
      currentPrice: price,
      isInStock,
      rawUnit: raw.rawUnit ?? null,
      baseWeightGrams: grams,
      pricePerGram,
      metadata: raw.metadata,
      lastSeenAt: new Date(),
      ...(keepManual
        ? {}
        : {
          ingredientId: match?.id ?? null,
          matchSource: match ? MatchSource.AUTO_KEYWORD : MatchSource.NONE,
          matchedKeyword: match?.keyword ?? null,
        }),
    };

    const product = await prisma.product.upsert({
      where: { storeId_sku: { storeId: store.id, sku } },
      update: data,
      create: data,
    });
    result.saved++;

    // Chỉ ghi lịch sử khi giá hoặc tình trạng còn hàng thật sự khác lần trước.
    const changed =
      !existing ||
      existing.isInStock !== isInStock ||
      !existing.currentPrice ||
      !existing.currentPrice.equals(price);
    if (changed) {
      await prisma.productPriceHistory.create({
        data: {
          productId: product.id,
          price,
          isInStock,
          crawlRunId: crawlRunId ?? null,
        },
      });
      result.priceChanged++;
    }
  }

  return result;
}
