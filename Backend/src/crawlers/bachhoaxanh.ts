import axios from 'axios';
import * as cheerio from 'cheerio';
import logger from 'jet-logger';

import { ICrawler, IRawProduct, parsePriceVnd } from './common';

/******************************************************************************
                                Constants
******************************************************************************/

const BASE_URL = 'https://www.bachhoaxanh.com';

// Danh mục thực phẩm liên quan tới bảng Ingredient
const CATEGORY_PATHS = [
  '/thit-heo',
  '/thit-ga',
  '/thit-bo',
  '/ca-tom-muc-ech',
  '/trung-ga-vit-cut',
  '/rau-la',
  '/cu-qua',
  '/trai-cay',
  '/gao-cac-loai',
  '/dau-hu-tau-hu',
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
  // Selector dựa trên cấu trúc trang danh mục BHX (có thể đổi theo thời gian)
  $('a[href]').each((_, el) => {
    const $el = $(el);
    const name =
      $el.find('h3').text().trim() ||
      $el.find('.product_name').text().trim();
    const priceText =
      $el.find('.product_price').text().trim() ||
      $el.find('[class*=price]').first().text().trim();
    if (!name || !priceText) return;
    const price = parsePriceVnd(priceText);
    if (!Number.isFinite(price) || price < 1000) return;
    const href = $el.attr('href') ?? '';
    products.push({
      name,
      price,
      url: href.startsWith('http') ? href : `${BASE_URL}${href}`,
    });
  });
  return products;
}

async function crawl(): Promise<IRawProduct[]> {
  const all: IRawProduct[] = [];
  for (const path of CATEGORY_PATHS) {
    try {
      const products = await crawlCategory(path);
      all.push(...products);
      // lịch sự với server, tránh bị chặn
      await new Promise((r) => setTimeout(r, 1500));
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
