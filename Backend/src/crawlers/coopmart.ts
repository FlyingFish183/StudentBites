import axios from 'axios';
import * as cheerio from 'cheerio';
import logger from 'jet-logger';

import { ICrawler, IRawProduct, parsePriceVnd } from './common';

/******************************************************************************
                                Constants
******************************************************************************/

const BASE_URL = 'https://cooponline.vn';

const CATEGORY_PATHS = [
  '/groups/thit-heo/',
  '/groups/thit-gia-cam/',
  '/groups/thit-bo/',
  '/groups/thuy-hai-san/',
  '/groups/trung/',
  '/groups/rau-cu/',
  '/groups/trai-cay/',
  '/groups/gao-nong-san/',
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
  // Cấu trúc WooCommerce phổ biến của Co.op Online
  $('.product-item, li.product, [class*=product-inner]').each((_, el) => {
    const $el = $(el);
    const name =
      $el.find('.name, .woocommerce-loop-product__title, h3, h2')
        .first().text().trim();
    const priceText = $el
      .find('.price ins, .price, [class*=price]')
      .first()
      .text()
      .trim();
    if (!name || !priceText) return;
    const price = parsePriceVnd(priceText);
    if (!Number.isFinite(price) || price < 1000) return;
    const href = $el.find('a[href]').first().attr('href') ?? '';
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
      all.push(...(await crawlCategory(path)));
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
