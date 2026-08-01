import bcrypt from 'bcryptjs';

import HttpStatusCodes from '@src/common/constants/HttpStatusCodes';
import { RouteError } from '@src/common/utils/route-errors';
import prisma from '@src/repos/prisma';

/******************************************************************************
                                Constants
******************************************************************************/

const Errors = {
  EMAIL_TAKEN: 'Email đã được đăng ký',
  BAD_CREDENTIALS: 'Email hoặc mật khẩu không đúng',
  USER_NOT_FOUND: 'Không tìm thấy người dùng',
} as const;

const SALT_ROUNDS = 10;

/******************************************************************************
                                Functions
******************************************************************************/

/**
 * Đăng ký tài khoản mới, trả về user id.
 */
async function register(
  email: string,
  password: string,
  name: string,
): Promise<number> {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new RouteError(HttpStatusCodes.CONFLICT, Errors.EMAIL_TAKEN);
  }
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await prisma.user.create({
    data: { email, passwordHash, name },
  });
  return user.id;
}

/**
 * Đăng nhập, trả về user id nếu đúng thông tin.
 */
async function login(email: string, password: string): Promise<number> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new RouteError(HttpStatusCodes.UNAUTHORIZED, Errors.BAD_CREDENTIALS);
  }
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    throw new RouteError(HttpStatusCodes.UNAUTHORIZED, Errors.BAD_CREDENTIALS);
  }
  return user.id;
}

/**
 * Lấy thông tin user hiện tại (kèm profile nếu có).
 */
async function getMe(userId: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
      profile: true,
    },
  });
  if (!user) {
    throw new RouteError(HttpStatusCodes.NOT_FOUND, Errors.USER_NOT_FOUND);
  }
  return user;
}

/******************************************************************************
                            Export default
******************************************************************************/

export default {
  Errors,
  register,
  login,
  getMe,
} as const;
