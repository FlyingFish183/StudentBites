import axios from 'axios';
import * as cheerio from 'cheerio';
import logger from 'jet-logger';

import { ICrawler, IRawProduct, parsePriceVnd } from './common';

/******************************************************************************
                                Constants
******************************************************************************/

const BASE_URL = 'https://winmart.vn';

const CATEGORY_PATHS = [
  '/categories/thit-1980',
  '/categories/thuy-hai-san-1981',
  '/categories/trung-1983',
  '/categories/rau-cu-qua-1976',
  '/categories/gao-bot-do-kho-2015',
  '/categories/sua-cac-loai-1972',
];

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
    '(KHTML, like Gecko) Chrome/125.0 Safari/537.36',
  'Accept-Language': 'vi-VN,vi;q=0.9',
};

/******************************************************************************
                                Functions
******************************************************************************/

async function crawlCategory(path: string): Promise<IRawProduct[]> {
  const url = `${BASE_URL}${path}`;
  const { data: html } = await axios.get<string>(url, {
    headers: HEADERS,
    timeout: 20000,
  });
  const $ = cheerio.load(html);
  const products: IRawProduct[] = [];
  // WinMart render SSR bằng Next.js — thử đọc từ __NEXT_DATA__ trước
  const nextData = $('#__NEXT_DATA__').html();
  if (nextData) {
    try {
      const json = JSON.parse(nextData) as Record<string, unknown>;
      const found: IRawProduct[] = [];
      // duyệt đệ quy tìm object có name + price
      const walk = (node: unknown): void => {
        if (Array.isArray(node)) return node.forEach(walk);
        if (node && typeof node === 'object') {
          const obj = node as Record<string, unknown>;
          if (
            typeof obj.name === 'string' &&
            (typeof obj.price === 'number' || typeof obj.salePrice === 'number')
          ) {
            const price = (obj.salePrice ?? obj.price) as number;
            if (price > 1000) {
              found.push({ name: obj.name, price, url });
            }
          }
          Object.values(obj).forEach(walk);
        }
      };
      walk(json);
      if (found.length > 0) return found;
    } catch {
      // rơi xuống parse HTML bên dưới
    }
  }
  // Fallback: parse card sản phẩm từ HTML
  $('[class*=product-card], [class*=ProductCard]').each((_, el) => {
    const $el = $(el);
    const name = $el.find('[class*=name]').first().text().trim();
    const priceText = $el.find('[class*=price]').first().text().trim();
    if (!name || !priceText) return;
    const price = parsePriceVnd(priceText);
    if (!Number.isFinite(price) || price < 1000) return;
    products.push({ name, price, url });
  });
  return products;
}

async function crawl(): Promise<IRawProduct[]> {
  const all: IRawProduct[] = [];
  for (const path of CATEGORY_PATHS) {
    try {
      all.push(...(await crawlCategory(path)));
      await new Promise((r) => setTimeout(r, 1500));
    } catch (err) {
      logger.warn(`[winmart] Lỗi crawl ${path}: ${String(err)}`);
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
