import { Request, Response } from 'express';

import HttpStatusCodes from '@src/common/constants/HttpStatusCodes';
import NotificationService from '@src/services/NotificationService';

import { getUserId } from './common/auth';

/******************************************************************************
                                Functions
******************************************************************************/

/**
 * Lấy danh sách thông báo của người dùng.
 *
 * @route GET /api/notifications
 */
async function list(req: Request, res: Response) {
  const userId = getUserId(res);
  const unreadOnly = req.query.unread === 'true';
  const notifications = await NotificationService.list(userId, unreadOnly);
  res.status(HttpStatusCodes.OK).json({ notifications });
}

/**
 * Đánh dấu một thông báo đã đọc.
 *
 * @route PUT /api/notifications/:id
 */
async function markRead(req: Request, res: Response) {
  const userId = getUserId(res);
  await NotificationService.markRead(userId, Number(req.params.id));
  res.status(HttpStatusCodes.OK).json({ success: true });
}

/******************************************************************************
                            Export default
******************************************************************************/

export default { list, markRead } as const;
