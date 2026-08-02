import axios from 'axios';
import logger from 'jet-logger';

import { ICrawler, IRawProduct } from './common';

/******************************************************************************
                                Constants
******************************************************************************/

const BASE_URL = 'https://www.bachhoaxanh.com';
const API_BASE = 'https://api.bachhoaxanh.com/gw';

/**
 * Giá BHX phụ thuộc cửa hàng giao hàng. Các ID lấy từ DevTools khi đã chọn
 * địa chỉ (đo 2026-08-02). Đổi nếu muốn crawl theo khu vực khác.
 */
const PROVINCE_ID = 1027;
const STORE_ID = 29987;
const WARD_ID = 100695;

/**
 * Slug danh mục hiện tại (một số path cũ đã đổi / redirect).
 * Đo qua Sitemap/SitemapCate + Category/IsCheckCate, 2026-08-02.
 */
const CATEGORY_PATHS = [
  '/thit-heo',
  '/thit-ga',
  '/thit-bo',
  '/ca-tom-muc-ech',
  '/trung',
  '/rau-sach',
  '/cu',
  '/trai-cay-tuoi-ngon',
  '/gao-gao-nep',
  '/sua-tuoi',
  '/hang-dong-mat-khac', // đậu hũ, bánh flan…
];

const API_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
    '(KHTML, like Gecko) Chrome/125.0 Safari/537.36',
  Accept: 'application/json, text/plain, */*',
  Origin: BASE_URL,
  Referer: `${BASE_URL}/`,
  platform: 'webnew',
  xapikey: 'bhx-api-core-2022',
  reversehost: 'http://bhxapi.live',
};

/******************************************************************************
                                Types
******************************************************************************/

interface IBhxPrice {
  price?: number;
  sysPrice?: number;
  isCanBuy?: boolean;
}

interface IBhxProduct {
  id?: number;
  productCode?: string;
  name?: string;
  fullName?: string;
  url?: string;
  avatar?: string;
  unit?: string;
  productPrices?: IBhxPrice[];
}

interface IBhxCateMeta {
  code?: number;
  data?: {
    id?: number;
    newUrl?: string;
    typeRedirect?: number;
  };
  message?: string;
}

interface IBhxCateProducts {
  code?: number;
  data?: {
    products?: IBhxProduct[];
    total?: number;
  };
  message?: string;
}

/******************************************************************************
                                Functions
******************************************************************************/

function slugFromPath(path: string): string {
  return path.replace(/^\/+/, '').replace(/\/+$/, '');
}

function pickPrice(item: IBhxProduct): number | null {
  const prices = item.productPrices ?? [];
  for (const p of prices) {
    const value = p.price ?? p.sysPrice;
    if (typeof value === 'number' && value >= 1000) return value;
  }
  return null;
}

function toRawProduct(item: IBhxProduct, categoryPath: string): IRawProduct | null {
  const name = (item.fullName || item.name || '').trim();
  const price = pickPrice(item);
  if (!name || price === null) return null;

  const href = item.url?.trim() ?? '';
  const canBuy = item.productPrices?.some((p) => p.isCanBuy !== false) ?? true;

  return {
    sku: item.productCode?.trim() || (item.id != null ? String(item.id) : undefined),
    name,
    price,
    url: href
      ? href.startsWith('http')
        ? href
        : `${BASE_URL}${href}`
      : `${BASE_URL}${categoryPath}`,
    imageUrl: item.avatar,
    rawUnit: item.unit,
    inStock: canBuy,
    categoryPath,
  };
}

/** Map slug danh mục → categoryId (kèm theo redirect nếu site đổi URL). */
async function resolveCategory(path: string): Promise<{ slug: string; id: number } | null> {
  const slug = slugFromPath(path);
  const { data } = await axios.get<IBhxCateMeta>(`${API_BASE}/Category/IsCheckCate`, {
    headers: API_HEADERS,
    params: {
      Url: slug,
      ProvinceId: PROVINCE_ID,
      StoreId: STORE_ID,
    },
    timeout: 20000,
  });

  const meta = data.data;
  if (!meta) return null;

  // Site đôi khi 301 sang slug mới (vd. trai-cay → trai-cay-tuoi-ngon)
  if (meta.typeRedirect === 301 && meta.newUrl) {
    return resolveCategory(`/${meta.newUrl}`);
  }

  if (!meta.id || meta.id <= 0) return null;
  return { slug, id: meta.id };
}

async function crawlCategory(path: string): Promise<IRawProduct[]> {
  const resolved = await resolveCategory(path);
  if (!resolved) {
    logger.warn(`[bachhoaxanh] Không resolve được danh mục ${path}`);
    return [];
  }

  const { data } = await axios.get<IBhxCateProducts>(
    `${API_BASE}/Category/FatherCategoryGetProducts`,
    {
      headers: API_HEADERS,
      params: {
        Url: resolved.slug,
        CategoryId: resolved.id,
        ProvinceId: PROVINCE_ID,
        StoreId: STORE_ID,
        WardId: WARD_ID,
        Enviroment: 2,
        PageIndex: 0,
        PageSize: 40,
      },
      timeout: 20000,
    },
  );

  const categoryPath = `/${resolved.slug}`;
  const products: IRawProduct[] = [];
  for (const item of data.data?.products ?? []) {
    const raw = toRawProduct(item, categoryPath);
    if (raw) products.push(raw);
  }
  return products;
}

async function crawl(): Promise<IRawProduct[]> {
  const all: IRawProduct[] = [];
  const seen = new Set<string>();

  for (const path of CATEGORY_PATHS) {
    try {
      const products = await crawlCategory(path);
      for (const p of products) {
        const key = p.sku || p.name;
        if (seen.has(key)) continue;
        seen.add(key);
        all.push(p);
      }
      await new Promise((r) => setTimeout(r, 800));
    } catch (err) {
      logger.warn(`[bachhoaxanh] Lỗi crawl ${path}: ${String(err)}`);
    }
  }
  return all;
}

/******************************************************************************
                            Export default
******************************************************************************/

const BachHoaXanhCrawler: ICrawler = {
  sourceSite: 'bachhoaxanh',
  crawl,
};

export default BachHoaXanhCrawler;
