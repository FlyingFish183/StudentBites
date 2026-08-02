import { Request, Response } from 'express';

import HttpStatusCodes from '@src/common/constants/HttpStatusCodes';
import { crawlerSites } from '@src/crawlers/runner';
import { getCrawlQueue } from '@src/queue/queues';
import { enqueueCrawl } from '@src/queue/scheduler';

import { getActor } from './common/admin-auth';

/******************************************************************************
                                Functions
******************************************************************************/

/**
 * Tình trạng hàng đợi: đếm job theo trạng thái + lịch định kỳ đang đặt.
 *
 * @route GET /api/admin/queue/status
 */
async function status(_: Request, res: Response) {
  const queue = getCrawlQueue();
  const [counts, schedulers] = await Promise.all([
    queue.getJobCounts(
      'waiting',
      'active',
      'completed',
      'failed',
      'delayed',
      'paused',
    ),
    queue.getJobSchedulers(),
  ]);
  res.status(HttpStatusCodes.OK).json({
    queue: queue.name,
    counts,
    schedulers: schedulers.map((s) => ({
      key: s.key,
      pattern: s.pattern,
      tz: s.tz,
      next: s.next,
    })),
    sites: crawlerSites(),
  });
}

/**
 * Đẩy một job crawl chạy ngay.
 *
 * @route POST /api/admin/queue/crawl
 */
async function runNow(req: Request, res: Response) {
  const body = req.body as { sourceSite?: unknown };
  const sourceSite =
    typeof body.sourceSite === 'string' ? body.sourceSite : '';
  if (!crawlerSites().includes(sourceSite)) {
    res.status(HttpStatusCodes.BAD_REQUEST).json({
      error: `sourceSite phải là một trong: ${crawlerSites().join(', ')}`,
    });
    return;
  }
  const jobId = await enqueueCrawl(sourceSite, getActor(res).email);
  res.status(HttpStatusCodes.OK).json({ jobId, sourceSite });
}

/******************************************************************************
                            Export default
******************************************************************************/

export default {
  status,
  runNow,
} as const;
