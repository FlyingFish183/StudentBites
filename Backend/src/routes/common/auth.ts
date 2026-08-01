import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

import EnvVars from '@src/common/constants/env';
import HttpStatusCodes from '@src/common/constants/HttpStatusCodes';

/******************************************************************************
                                Constants
******************************************************************************/

export const AUTH_COOKIE = 'sb_token';

interface ITokenPayload {
  userId: number;
}

/******************************************************************************
                                Functions
******************************************************************************/

/**
 * Middleware: yêu cầu đăng nhập, gắn userId vào res.locals.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = (req.cookies as Record<string, string>)?.[AUTH_COOKIE];
  if (!token) {
    res
      .status(HttpStatusCodes.UNAUTHORIZED)
      .json({ error: 'Chưa đăng nhập' });
    return;
  }
  try {
    const payload = jwt.verify(token, EnvVars.JwtSecret) as ITokenPayload;
    res.locals.userId = payload.userId;
    next();
  } catch {
    res
      .status(HttpStatusCodes.UNAUTHORIZED)
      .json({ error: 'Phiên đăng nhập hết hạn' });
  }
}

/**
 * Tạo JWT cho user.
 */
export function signToken(userId: number): string {
  return jwt.sign({ userId } satisfies ITokenPayload, EnvVars.JwtSecret, {
    expiresIn: '30d',
  });
}

/**
 * Lấy userId đã được requireAuth gắn vào.
 */
export function getUserId(res: Response): number {
  return res.locals.userId as number;
}
