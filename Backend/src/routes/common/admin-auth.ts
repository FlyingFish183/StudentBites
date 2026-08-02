import { NextFunction, Request, Response } from 'express';

import HttpStatusCodes from '@src/common/constants/HttpStatusCodes';
import prisma from '@src/repos/prisma';

import { getUserId } from './auth';

/******************************************************************************
                                Constants
******************************************************************************/

const Errors = {
  NOT_CONFIGURED:
    'Trang quản trị chưa được bật. Đặt ADMIN_EMAILS trong file .env rồi khởi ' +
    'động lại server.',
  FORBIDDEN: 'Tài khoản này không có quyền quản trị.',
} as const;

/**
 * Danh sách email quản trị, đọc thẳng từ process.env chứ không qua EnvVars —
 * để môi trường nào chưa khai biến này thì server vẫn khởi động bình thường.
 */
function adminEmails(): string[] {
  // eslint-disable-next-line no-process-env -- cố ý không qua EnvVars, xem chú thích trên
  return (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

/******************************************************************************
                                Functions
******************************************************************************/

/**
 * Middleware: chỉ cho qua nếu email của người đang đăng nhập nằm trong
 * ADMIN_EMAILS. Chưa khai biến thì chặn tất cả — mặc định đóng, không mở.
 *
 * Phải đặt SAU requireAuth.
 */
export async function requireAdmin(
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  const allowed = adminEmails();
  if (allowed.length === 0) {
    res
      .status(HttpStatusCodes.FORBIDDEN)
      .json({ error: Errors.NOT_CONFIGURED });
    return;
  }
  const user = await prisma.user.findUnique({
    where: { id: getUserId(res) },
    select: { email: true },
  });
  if (!user || !allowed.includes(user.email.toLowerCase())) {
    res.status(HttpStatusCodes.FORBIDDEN).json({ error: Errors.FORBIDDEN });
    return;
  }
  // Giữ lại email để ghi nhật ký, khỏi truy vấn lần nữa ở tầng service.
  res.locals.adminEmail = user.email;
  next();
}

/** Người đang thao tác, dùng cho nhật ký quản trị. */
export function getActor(res: Response): { id: number; email: string } {
  return {
    id: getUserId(res),
    email: (res.locals.adminEmail as string) ?? '',
  };
}
