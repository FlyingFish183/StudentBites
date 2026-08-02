import { ConnectionOptions } from 'bullmq';

/******************************************************************************
                                Constants
******************************************************************************/

const DEFAULT_URL = 'redis://localhost:6381';

/******************************************************************************
                                Functions
******************************************************************************/

/**
 * Thông tin kết nối Redis cho BullMQ.
 *
 * Trả về object tuỳ chọn chứ không phải một client ioredis dựng sẵn: BullMQ
 * ghim ioredis 5.x, cài ioredis riêng ở ngoài dễ lệch bản và sinh lỗi khó
 * lần. Để BullMQ tự tạo client thì không bao giờ vướng chuyện đó.
 *
 * Đọc thẳng process.env chứ không qua EnvVars, để môi trường nào chưa khai
 * REDIS_URL thì vẫn chạy được bằng giá trị mặc định.
 */
export function redisConnection(): ConnectionOptions {
  // eslint-disable-next-line no-process-env -- xem chú thích trên
  const url = new URL(process.env.REDIS_URL ?? DEFAULT_URL);
  return {
    host: url.hostname,
    port: Number(url.port || 6379),
    password: url.password || undefined,
    // BullMQ bắt buộc: worker chờ job bằng lệnh blocking, không được giới hạn
    // số lần thử lại theo request.
    maxRetriesPerRequest: null,
  };
}

/** Chuỗi kết nối đang dùng, để in ra log lúc khởi động. */
export function redisUrl(): string {
  // eslint-disable-next-line no-process-env -- xem chú thích trên
  return process.env.REDIS_URL ?? DEFAULT_URL;
}
