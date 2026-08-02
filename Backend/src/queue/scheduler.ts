import logger from 'jet-logger';

import { crawlerSites } from '@src/crawlers/runner';

import { getCrawlQueue, ICrawlJobData, JOB_CRAWL_SITE } from './queues';

/******************************************************************************
                                Constants
******************************************************************************/

/** 2h sáng mỗi ngày, giờ Việt Nam. */
const CRON = '0 2 * * *';
const TIMEZONE = 'Asia/Ho_Chi_Minh';

/******************************************************************************
                                Functions
******************************************************************************/

/**
 * Đăng ký lịch crawl định kỳ cho từng nguồn.
 *
 * Khác node-cron trước đây ở ba điểm:
 * 1. Lịch nằm trong Redis, không nằm trong bộ nhớ tiến trình — chạy nhiều bản
 *    worker vẫn chỉ sinh một job mỗi mốc, không crawl trùng.
 * 2. Mỗi nguồn một job riêng, nên một site hỏng không kéo theo site khác và
 *    có thể thử lại riêng.
 * 3. Job nằm lại trong hàng đợi, xem được lịch sử thay vì mất theo log.
 *
 * `jobId` cố định theo nguồn nên gọi lại hàm này nhiều lần không sinh lịch
 * trùng — an toàn khi worker khởi động lại.
 */
export async function scheduleCrawlJobs(): Promise<void> {
  const queue = getCrawlQueue();
  for (const sourceSite of crawlerSites()) {
    const data: ICrawlJobData = { sourceSite, triggeredBy: 'scheduler' };
    await queue.upsertJobScheduler(
      `daily-${sourceSite}`,
      { pattern: CRON, tz: TIMEZONE },
      { name: JOB_CRAWL_SITE, data },
    );
  }
  logger.info(
    `[queue] Đã đặt lịch crawl hằng ngày (${CRON} ${TIMEZONE}) cho ` +
    `${crawlerSites().join(', ')}`,
  );
}

/**
 * Đẩy một job crawl chạy ngay. Dùng cho nút "Chạy ngay" ở khu quản trị.
 */
export async function enqueueCrawl(
  sourceSite: string,
  triggeredBy: string,
): Promise<string> {
  const queue = getCrawlQueue();
  const job = await queue.add(
    JOB_CRAWL_SITE,
    { sourceSite, triggeredBy },
    // Chạy tay thì bỏ qua thời gian chờ, nhưng vẫn giữ cơ chế thử lại.
    { priority: 1 },
  );
  return job.id ?? '';
}
