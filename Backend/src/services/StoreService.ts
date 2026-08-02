import { MatchSource, StoreType } from '@prisma/client';
import axios from 'axios';

import HttpStatusCodes from '@src/common/constants/HttpStatusCodes';
import { RouteError } from '@src/common/utils/route-errors';
import prisma from '@src/repos/prisma';

import { parseDateOnly } from './PlannerService';

/******************************************************************************
                                Constants
******************************************************************************/

const Errors = {
  NO_PLAN: 'Chưa có thực đơn cho ngày này. Hãy tạo thực đơn trước.',
  GEOCODE_FAILED: 'Không tìm thấy địa chỉ',
} as const;

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const USER_AGENT = 'StudentBites/1.0 (student project)';

/******************************************************************************
                                Types
******************************************************************************/

interface IOsmElement {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

/******************************************************************************
                                Helpers
******************************************************************************/

/**
 * Giá seed (sku `seed-…`, metadata.seed, hoặc MANUAL seed) chỉ là dự phòng
 * khi crawler chưa có dữ liệu. Không được thắng giá crawl thật.
 */
function isSeedProduct(p: {
  sku: string;
  matchSource: MatchSource;
  metadata: unknown;
}): boolean {
  if (p.sku.startsWith('seed-')) return true;
  if (p.matchSource !== MatchSource.MANUAL) return false;
  const meta = p.metadata as { seed?: boolean } | null;
  return meta?.seed === true;
}

/** Khoảng cách haversine (mét). */
function distanceM(
  lat1: number, lng1: number, lat2: number, lng2: number,
): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function osmShopToStoreType(shop?: string): StoreType {
  if (shop === 'supermarket') return StoreType.SUPERMARKET;
  if (shop === 'convenience') return StoreType.CONVENIENCE;
  return StoreType.MARKET;
}

/******************************************************************************
                                Functions
******************************************************************************/

/**
 * FR-5.1/5.2: Tìm chợ / siêu thị / cửa hàng trong bán kính quanh vị trí.
 */
async function nearby(lat: number, lng: number, radiusM: number) {
  const query = `
    [out:json][timeout:15];
    (
      node["shop"~"supermarket|convenience"](around:${radiusM},${lat},${lng});
      way["shop"~"supermarket|convenience"](around:${radiusM},${lat},${lng});
      node["amenity"="marketplace"](around:${radiusM},${lat},${lng});
      way["amenity"="marketplace"](around:${radiusM},${lat},${lng});
    );
    out center 60;`;
  const { data } = await axios.post<{ elements: IOsmElement[] }>(
    OVERPASS_URL,
    `data=${encodeURIComponent(query)}`,
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': USER_AGENT,
      },
      timeout: 20000,
    },
  );

  const stores = [];
  for (const el of data.elements ?? []) {
    const elLat = el.lat ?? el.center?.lat;
    const elLng = el.lon ?? el.center?.lon;
    if (elLat == null || elLng == null) continue;
    const tags = el.tags ?? {};
    const name = tags.name ?? (tags.amenity === 'marketplace'
      ? 'Chợ (không tên)'
      : 'Cửa hàng (không tên)');
    const type = tags.amenity === 'marketplace'
      ? StoreType.MARKET
      : osmShopToStoreType(tags.shop);
    const address = [tags['addr:housenumber'], tags['addr:street'],
      tags['addr:city']].filter(Boolean).join(' ') || null;
    const osmId = `${el.type}-${el.id}`;
    // cache vào DB để dùng lại
    const row = await prisma.store.upsert({
      where: { osmId },
      update: { name, type, address, lat: elLat, lng: elLng },
      create: {
        name, type, address,
        lat: elLat, lng: elLng,
        sourceSite: 'osm', osmId,
      },
    });
    stores.push({
      id: row.id,
      name,
      type,
      address,
      lat: elLat,
      lng: elLng,
      distanceM: distanceM(lat, lng, elLat, elLng),
    });
  }
  stores.sort((a, b) => a.distanceM - b.distanceM);
  return stores;
}

/**
 * FR-5.1: Geocode địa chỉ tự nhập (KTX, phòng trọ...) qua Nominatim.
 */
async function geocode(q: string) {
  const { data } = await axios.get<
    { lat: string; lon: string; display_name: string }[]
  >(NOMINATIM_URL, {
    params: { q, format: 'json', limit: 5, countrycodes: 'vn' },
    headers: { 'User-Agent': USER_AGENT },
    timeout: 15000,
  });
  if (!data.length) {
    throw new RouteError(HttpStatusCodes.NOT_FOUND, Errors.GEOCODE_FAILED);
  }
  return data.map((r) => ({
    lat: Number(r.lat),
    lng: Number(r.lon),
    label: r.display_name,
  }));
}

/**
 * FR-5.3: So sánh giá nguyên liệu của thực đơn 1 ngày giữa các nguồn bán.
 */
async function compare(userId: number, dateStr: string) {
  const date = parseDateOnly(dateStr);
  const plan = await prisma.mealPlan.findUnique({
    where: { userId_date: { userId, date } },
    include: {
      items: {
        include: {
          dish: {
            include: {
              ingredients: { include: { ingredient: true } },
            },
          },
        },
      },
    },
  });
  if (!plan || plan.items.length === 0) {
    throw new RouteError(HttpStatusCodes.NOT_FOUND, Errors.NO_PLAN);
  }

  // Gom tổng lượng cần mua theo nguyên liệu
  const needed = new Map<number, { name: string; grams: number }>();
  for (const item of plan.items) {
    for (const di of item.dish.ingredients) {
      const cur = needed.get(di.ingredientId);
      needed.set(di.ingredientId, {
        name: di.ingredient.name,
        grams: (cur?.grams ?? 0) + di.amountGrams,
      });
    }
  }

  const ingredientIds = [...needed.keys()];

  // Giá luôn thuộc về Product; giá của nguyên liệu là suy ra. Chỉ lấy hàng
  // còn bán và đã đọc được khối lượng — thiếu pricePerGram thì không so được.
  const products = await prisma.product.findMany({
    where: {
      ingredientId: { in: ingredientIds },
      isInStock: true,
      pricePerGram: { not: null },
    },
    include: { store: true },
    orderBy: { pricePerGram: 'asc' },
  });

  // Với mỗi nguyên liệu: mỗi cửa hàng giữ đúng một chào giá rẻ nhất.
  // Có dữ liệu crawl thì CHỈ dùng crawl — không để giá seed ảo thắng giá thật
  // chỉ vì seed gắn với store khác. Seed chỉ khi crawler chưa match nguyên liệu.
  const items = ingredientIds.map((ingId) => {
    const info = needed.get(ingId)!;
    const forIngredient = products.filter((p) => p.ingredientId === ingId);
    const crawled = forIngredient.filter((p) => !isSeedProduct(p));
    const pool = crawled.length > 0
      ? crawled
      : forIngredient.filter((p) => isSeedProduct(p));

    const cheapestPerStore = new Map<number, (typeof products)[number]>();
    for (const p of pool) {
      // pool đã sắp theo pricePerGram tăng dần nên gặp trước là rẻ nhất
      if (!cheapestPerStore.has(p.storeId)) cheapestPerStore.set(p.storeId, p);
    }

    const offers = [...cheapestPerStore.values()]
      .map((p) => {
        const perGram = Number(p.pricePerGram);
        return {
          storeId: p.storeId,
          storeName: p.store.name,
          sourceSite: p.store.sourceSite,
          productName: p.name,
          productUrl: p.url,
          // chi phí ước tính cho đúng lượng cần mua
          estimatedCost: Math.round(perGram * info.grams),
          pricePer100g: Math.round(perGram * 100),
          crawledAt: p.lastSeenAt,
          isReference: isSeedProduct(p),
        };
      })
      .sort((a, b) => a.estimatedCost - b.estimatedCost);

    return {
      ingredientId: ingId,
      name: info.name,
      grams: Math.round(info.grams),
      bestOffer: offers[0] ?? null,
      offers,
    };
  });

  // Tổng tiền nếu mua tất cả tại từng nguồn
  const storeTotals = new Map<
    number,
    {
      storeName: string;
      sourceSite: string | null;
      total: number;
      itemCount: number;
    }
  >();
  for (const item of items) {
    for (const offer of item.offers) {
      const cur = storeTotals.get(offer.storeId) ?? {
        storeName: offer.storeName,
        sourceSite: offer.sourceSite,
        total: 0,
        itemCount: 0,
      };
      cur.total += offer.estimatedCost;
      cur.itemCount += 1;
      storeTotals.set(offer.storeId, cur);
    }
  }
  const bestTotal = Math.round(
    items.reduce((s, i) => s + (i.bestOffer?.estimatedCost ?? 0), 0),
  );

  return {
    date: dateStr,
    items,
    storeTotals: [...storeTotals.entries()]
      .map(([storeId, v]) => ({ storeId, ...v }))
      .sort((a, b) => a.total - b.total),
    bestTotal,
  };
}

/******************************************************************************
                            Export default
******************************************************************************/

export default {
  Errors,
  nearby,
  geocode,
  compare,
} as const;
