import { Job, Worker } from 'bullmq';
import logger from 'jet-logger';

import { runCrawler } from '@src/crawlers/runner';

import { redisConnection } from './connection';
import { ICrawlJobData, QUEUE_CRAWL } from './queues';

/******************************************************************************
                                Constants
******************************************************************************/

/**
 * Chạy tối đa 1 job cùng lúc.
 *
 * Cố ý không cho song song: crawl nhiều site cùng lúc từ một IP dễ bị chặn
 * hơn, và tuần tự thì log đọc dễ hơn nhiều. Muốn nhanh hơn thì tăng số này,
 * nhưng phải cân nhắc chuyện lịch sự với website.
 */
const CONCURRENCY = 1;

/******************************************************************************
                                Functions
******************************************************************************/

async function process(job: Job<ICrawlJobData>): Promise<unknown> {
  const { sourceSite, triggeredBy } = job.data;
  logger.info(
    `[worker] job #${job.id} crawl ${sourceSite} ` +
    `(lần thử ${job.attemptsMade + 1}, do ${triggeredBy})`,
  );
  const result = await runCrawler(sourceSite);
  // Không lấy được sản phẩm nào thì coi là THẤT BẠI để BullMQ thử lại và để
  // job hiện màu đỏ trên dashboard. Trả 0 rồi báo "hoàn tất" chính là cách cả
  // ba crawler hỏng suốt nhiều ngày mà không ai biết.
  if (result.productsFound === 0) {
    throw new Error(`${sourceSite}: không lấy được sản phẩm nào`);
  }
  return result;
}

/**
 * Dựng worker xử lý hàng đợi crawl. Gọi từ tiến trình worker riêng, không gọi
 * trong tiến trình API.
 */
export function createCrawlWorker(): Worker<ICrawlJobData> {
  const worker = new Worker<ICrawlJobData>(QUEUE_CRAWL, process, {
    connection: redisConnection(),
    concurrency: CONCURRENCY,
  });

  worker.on('completed', (job) => {
    logger.info(`[worker] job #${job.id} xong: ${job.data.sourceSite}`);
  });

  worker.on('failed', (job, err) => {
    const left = job ? job.opts.attempts! - job.attemptsMade : 0;
    logger.err(
      `[worker] job #${job?.id} hỏng: ${err.message}` +
      (left > 0 ? ` — sẽ thử lại ${left} lần nữa` : ' — hết lượt thử lại'),
    );
  });

  worker.on('error', (err) => {
    logger.err(`[worker] lỗi kết nối: ${err.message}`);
  });

  return worker;
}
