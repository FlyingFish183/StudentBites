import axios from 'axios';
import * as cheerio from 'cheerio';
import logger from 'jet-logger';

import { ICrawler, IRawProduct } from './common';

/******************************************************************************
                                Constants
******************************************************************************/

const BASE_URL = 'https://cooponline.vn';

/**
 * Đường dẫn danh mục hiện tại (site đã chuyển từ /groups/... sang /c/...).
 * Đo 2026-08-02: các path này trả HTTP 200 và có serverProducts trong
 * __NEXT_DATA__.
 */
const CATEGORY_PATHS = [
  '/c/thit-heo',
  '/c/thuy-hai-san',
  '/c/trung',
  '/c/trung-ga',
  '/c/rau-cu',
  '/c/trai-cay',
  '/c/gao',
];

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
    '(KHTML, like Gecko) Chrome/125.0 Safari/537.36',
  'Accept-Language': 'vi-VN,vi;q=0.9',
};

/******************************************************************************
                                Types
******************************************************************************/

interface ICoopPrice {
  latestPrice?: number;
  supplierRetailPrice?: number;
}

interface ICoopProduct {
  sku?: string;
  name?: string;
  imageUrl?: string;
  uom?: string;
  stockQuantity?: number;
  price?: ICoopPrice;
  link?: { as?: { pathname?: string } };
}

interface INextData {
  props?: {
    pageProps?: {
      serverProducts?: ICoopProduct[];
    };
  };
}

/******************************************************************************
                                Functions
******************************************************************************/

function productsFromNextData(html: string, categoryPath: string): IRawProduct[] {
  const $ = cheerio.load(html);
  const raw = $('#__NEXT_DATA__').html();
  if (!raw) return [];

  let data: INextData;
  try {
    data = JSON.parse(raw) as INextData;
  } catch {
    return [];
  }

  const serverProducts = data.props?.pageProps?.serverProducts ?? [];
  const products: IRawProduct[] = [];

  for (const item of serverProducts) {
    const name = item.name?.trim();
    const price = item.price?.latestPrice ?? item.price?.supplierRetailPrice;
    if (!name || typeof price !== 'number' || price < 1000) continue;

    const pathname = item.link?.as?.pathname;
    products.push({
      sku: item.sku?.trim() || undefined,
      name,
      price,
      url: pathname
        ? pathname.startsWith('http')
          ? pathname
          : `${BASE_URL}${pathname}`
        : `${BASE_URL}${categoryPath}`,
      imageUrl: item.imageUrl,
      rawUnit: item.uom,
      inStock: (item.stockQuantity ?? 0) > 0,
      categoryPath,
    });
  }

  return products;
}

async function crawlCategory(path: string): Promise<IRawProduct[]> {
  const url = `${BASE_URL}${path}`;
  const { data: html } = await axios.get<string>(url, {
    headers: HEADERS,
    timeout: 20000,
  });
  return productsFromNextData(html, path);
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
      await new Promise((r) => setTimeout(r, 1500));
    } catch (err) {
      logger.warn(`[coopmart] Lỗi crawl ${path}: ${String(err)}`);
    }
  }
  return all;
}

/******************************************************************************
                            Export default
******************************************************************************/

const CoopMartCrawler: ICrawler = {
  sourceSite: 'coopmart',
  crawl,
};

export default CoopMartCrawler;
