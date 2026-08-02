import { Queue, JobsOptions } from 'bullmq';

import { redisConnection } from './connection';

/******************************************************************************
                                Constants
******************************************************************************/

export const QUEUE_CRAWL = 'crawl';

/** Tên job trong hàng đợi crawl. */
export const JOB_CRAWL_SITE = 'crawl-site';

/**
 * Mặc định cho mọi job crawl.
 *
 * - `attempts: 3` — website chập chờn, timeout, 502 là chuyện thường; thử lại
 *   thường ăn ngay. Quá 3 lần thì gần như chắc chắn là hỏng thật (đổi HTML,
 *   đổi URL, bị chặn) chứ không phải trục trặc nhất thời.
 * - `backoff` mũ, gốc 30 giây → chờ 30s, 60s, 120s. Không dồn dập vào một
 *   website đang có vấn đề.
 * - Giữ lại lịch sử job để còn soi được: 100 job xong gần nhất, 500 job hỏng.
 */
export const CRAWL_JOB_OPTIONS: JobsOptions = {
  attempts: 3,
  backoff: { type: 'exponential', delay: 30_000 },
  removeOnComplete: { count: 100 },
  removeOnFail: { count: 500 },
};

/******************************************************************************
                                Types
******************************************************************************/

export interface ICrawlJobData {
  /** Trùng Store.code: bachhoaxanh | winmart | coopmart */
  sourceSite: string;
  /** Ai bấm chạy; 'scheduler' nếu do lịch định kỳ */
  triggeredBy: string;
}

/******************************************************************************
                                Functions
******************************************************************************/

let crawlQueue: Queue<ICrawlJobData> | null = null;

/**
 * Hàng đợi crawl, tạo một lần rồi dùng lại.
 *
 * Tạo lười (lazy) chứ không tạo lúc import: Queue mở kết nối Redis ngay khi
 * khởi tạo, mà test và một số lệnh CLI không có Redis chạy kèm.
 */
export function getCrawlQueue(): Queue<ICrawlJobData> {
  crawlQueue ??= new Queue<ICrawlJobData>(QUEUE_CRAWL, {
    connection: redisConnection(),
    defaultJobOptions: CRAWL_JOB_OPTIONS,
  });
  return crawlQueue;
}

/** Đóng kết nối; dùng khi tắt tiến trình cho gọn. */
export async function closeQueues(): Promise<void> {
  if (crawlQueue) {
    await crawlQueue.close();
    crawlQueue = null;
  }
}
