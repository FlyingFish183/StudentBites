import logger from 'jet-logger';

import { redisUrl } from './queue/connection';
import { createCrawlWorker } from './queue/crawl.worker';
import { closeQueues } from './queue/queues';
import { scheduleCrawlJobs } from './queue/scheduler';

/******************************************************************************
                                  Run
******************************************************************************/

/**
 * Tiến trình worker, chạy TÁCH KHỎI API.
 *
 * Tách ra vì ba lý do: crawl nặng và chậm, không nên tranh CPU với request
 * của người dùng; chạy nhiều bản API không còn sinh ra nhiều lịch crawl trùng
 * nhau; và khởi động lại API không làm mất job đang chờ.
 *
 * Chạy: npm run worker
 */
async function main() {
  logger.info(`[worker] Kết nối Redis ${redisUrl()}`);

  const worker = createCrawlWorker();
  await scheduleCrawlJobs();

  logger.info('[worker] Sẵn sàng, đang chờ job...');

  // Tắt êm: xử lý nốt job đang chạy rồi mới thoát.
  const shutdown = (signal: string) => {
    logger.info(`[worker] Nhận ${signal}, đang dừng...`);
    void (async () => {
      await worker.close();
      await closeQueues();
      logger.info('[worker] Đã dừng.');
      process.exit(0);
    })();
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

main().catch((err: unknown) => {
  logger.err(err, true);
  process.exit(1);
});
