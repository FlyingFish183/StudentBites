import logger from 'jet-logger';
import cron from 'node-cron';

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

// 2h sáng mỗi ngày
const CRON_SCHEDULE = '0 2 * * *';

/******************************************************************************
                                Functions
******************************************************************************/

/**
 * Chạy toàn bộ crawler 1 lượt và lưu giá vào DB.
 */
export async function runAllCrawlers(): Promise<void> {
  for (const crawler of CRAWLERS) {
    logger.info(`[crawler] Bắt đầu crawl ${crawler.sourceSite}...`);
    try {
      const products = await crawler.crawl();
      const matched = await saveProducts(crawler.sourceSite, products);
      logger.info(
        `[crawler] ${crawler.sourceSite}: lấy được ${products.length} sản ` +
        `phẩm, match ${matched} nguyên liệu`,
      );
    } catch (err) {
      logger.err(`[crawler] ${crawler.sourceSite} thất bại: ${String(err)}`);
    }
  }
}

/**
 * Đăng ký cron chạy định kỳ (gọi từ main.ts khi server khởi động).
 */
export function scheduleCrawlers(): void {
  cron.schedule(CRON_SCHEDULE, () => {
    void runAllCrawlers();
  });
  logger.info(`[crawler] Đã đặt lịch crawl hằng ngày (${CRON_SCHEDULE})`);
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
