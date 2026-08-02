import axios from 'axios';
import logger from 'jet-logger';

import { ICrawler, IRawProduct } from './common';

/******************************************************************************
                                Constants
******************************************************************************/

const BASE_URL = 'https://winmart.vn';
const API_BASE = 'https://api-crownx.winmart.vn';

/**
 * Trang danh mục HTML cũ (/categories/thit-1980) đã 404. WinMart render
 * sản phẩm phía client; danh sách lấy qua API tìm kiếm CrownX.
 *
 * Giá phụ thuộc cửa hàng — cố định một siêu thị HCM làm mốc so sánh.
 * Đo 2026-08-02: store 1535 (WM HCM Bàu Cát) trả được sản phẩm.
 */
const STORE_NO = '1535';
const STORE_GROUP_CODE = '1999';
const APPLICATION_TYPE = 'Windows';

/** Từ khoá thực phẩm gắn với bảng Ingredient — mỗi từ một trang API. */
const SEARCH_KEYWORDS = [
  'thit heo',
  'thit ga',
  'thit bo',
  'hai san',
  'ca',
  'trung',
  'rau',
  'cu qua',
  'trai cay',
  'gao',
  'dau hu',
  'sua tuoi',
];

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
    '(KHTML, like Gecko) Chrome/125.0 Safari/537.36',
  Accept: 'application/json',
  Origin: BASE_URL,
  Referer: `${BASE_URL}/`,
  'Content-Type': 'application/json',
};

/******************************************************************************
                                Types
******************************************************************************/

interface IWinPrice {
  salePrice?: number;
  originPrice?: number;
}

interface IWinItem {
  sku?: string;
  itemNo?: string;
  description?: string;
  seoName?: string;
  image?: string;
  uom?: string;
  uomName?: string;
  price?: IWinPrice;
  warehouse?: { availableQuantity?: number };
}

interface IWinSearchResponse {
  data?: IWinItem[];
}

/******************************************************************************
                                Functions
******************************************************************************/

function toRawProduct(item: IWinItem): IRawProduct | null {
  const name = item.description?.trim();
  const price = item.price?.salePrice ?? item.price?.originPrice;
  if (!name || typeof price !== 'number' || price < 1000) return null;

  const seo = item.seoName?.trim();
  return {
    sku: item.sku?.trim() || item.itemNo?.trim() || undefined,
    name,
    price,
    url: seo ? `${BASE_URL}/${seo}` : BASE_URL,
    imageUrl: item.image,
    rawUnit: item.uomName || item.uom,
    inStock: (item.warehouse?.availableQuantity ?? 0) > 0,
  };
}

async function searchKeyword(keyword: string): Promise<IRawProduct[]> {
  const { data } = await axios.post<IWinSearchResponse>(
    `${API_BASE}/ss/api/v2/public/winmart/item-search`,
    {
      keyword,
      pageNumber: 1,
      pageSize: 40,
      storeNo: STORE_NO,
      storeGroupCode: STORE_GROUP_CODE,
      applicationType: APPLICATION_TYPE,
    },
    { headers: HEADERS, timeout: 20000 },
  );

  const products: IRawProduct[] = [];
  for (const item of data.data ?? []) {
    const raw = toRawProduct(item);
    if (raw) products.push(raw);
  }
  return products;
}

async function crawl(): Promise<IRawProduct[]> {
  const all: IRawProduct[] = [];
  const seen = new Set<string>();

  for (const keyword of SEARCH_KEYWORDS) {
    try {
      const products = await searchKeyword(keyword);
      for (const p of products) {
        const key = p.sku || p.name;
        if (seen.has(key)) continue;
        seen.add(key);
        all.push(p);
      }
      await new Promise((r) => setTimeout(r, 800));
    } catch (err) {
      logger.warn(`[winmart] Lỗi search "${keyword}": ${String(err)}`);
    }
  }
  return all;
}

/******************************************************************************
                            Export default
******************************************************************************/

const WinMartCrawler: ICrawler = {
  sourceSite: 'winmart',
  crawl,
};

export default WinMartCrawler;
