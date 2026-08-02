import logger from 'jet-logger';

import prisma from '@src/repos/prisma';

import BachHoaXanhCrawler from './bachhoaxanh';
import { ICrawler, saveProducts } from './common';
import CoopMartCrawler from './coopmart';
import WinMartCrawler from './winmart';

/******************************************************************************
                                Constants
******************************************************************************/

const CRAWLERS: ICrawler[] = [
  BachHoaXanhCrawler,
  WinMartCrawler,
  CoopMartCrawler,
];

/******************************************************************************
                                Functions
******************************************************************************/

/******************************************************************************
                                Types
******************************************************************************/

export interface ICrawlResult {
  sourceSite: string;
  /** Số sản phẩm bóc được từ HTML */
  productsFound: number;
  /** Số sản phẩm ghi được vào bảng Product */
  saved: number;
  /** Số sản phẩm khớp được về một Ingredient */
  matched: number;
  /** Số sản phẩm giá đổi so với lần trước */
  priceChanged: number;
  /** Số sản phẩm không đọc được khối lượng nên chưa so giá được */
  noWeight: number;
}

/******************************************************************************
                                Functions
******************************************************************************/

/** Danh sách nguồn đang đăng ký. */
export function crawlerSites(): string[] {
  return CRAWLERS.map((c) => c.sourceSite);
}

/**
 * Chạy MỘT nguồn và lưu giá. Ném lỗi ra ngoài để nơi gọi (worker) quyết định
 * có thử lại hay không — đừng nuốt lỗi ở đây.
 */
export async function runCrawler(sourceSite: string): Promise<ICrawlResult> {
  const crawler = CRAWLERS.find((c) => c.sourceSite === sourceSite);
  if (!crawler) {
    throw new Error(`Không có crawler nào tên "${sourceSite}"`);
  }
  logger.info(`[crawler] Bắt đầu crawl ${sourceSite}...`);
  const products = await crawler.crawl();
  const saved = await saveProducts(sourceSite, products);
  logger.info(
    `[crawler] ${sourceSite}: bóc được ${products.length} sản phẩm, ` +
    `lưu ${saved.saved}, map ${saved.matched} nguyên liệu, ` +
    `${saved.priceChanged} giá đổi, ${saved.noWeight} không rõ khối lượng`,
  );
  return { sourceSite, productsFound: products.length, ...saved };
}

/**
 * Chạy tuần tự toàn bộ nguồn, bắt lỗi từng nguồn để một nguồn hỏng không
 * chặn nguồn còn lại. Dùng cho `npm run crawl`; đường chạy có hàng đợi thì
 * gọi runCrawler cho từng nguồn.
 */
export async function runAllCrawlers(): Promise<void> {
  for (const crawler of CRAWLERS) {
    try {
      await runCrawler(crawler.sourceSite);
    } catch (err) {
      logger.err(`[crawler] ${crawler.sourceSite} thất bại: ${String(err)}`);
    }
  }
}

/******************************************************************************
                                Run (CLI)
******************************************************************************/

// Chạy trực tiếp: npm run crawl
if (require.main === module) {
  runAllCrawlers()
    .then(() => {
      logger.info('[crawler] Hoàn tất');
      return prisma.$disconnect();
    })
    .catch((err) => {
      logger.err(err, true);
      process.exit(1);
    });
}
