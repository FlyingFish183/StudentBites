import { Request, Response } from 'express';
import { isNonEmptyString, isString } from 'jet-validators';

import EnvVars from '@src/common/constants/env';
import HttpStatusCodes from '@src/common/constants/HttpStatusCodes';
import AuthService from '@src/services/AuthService';

import { AUTH_COOKIE, getUserId, signToken } from './common/auth';
import parseReq from './common/parseReq';

/******************************************************************************
                                Constants
******************************************************************************/

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

const isEmailStr = (v: unknown): v is string =>
  isString(v) && /^\S+@\S+\.\S+$/.test(v);
const isPassword = (v: unknown): v is string =>
  isNonEmptyString(v) && v.length >= 6;

const reqValidators = {
  register: parseReq({
    email: isEmailStr,
    password: isPassword,
    name: isNonEmptyString,
  }),
  login: parseReq({
    email: isEmailStr,
    password: isNonEmptyString,
  }),
} as const;

/******************************************************************************
                                Functions
******************************************************************************/

function setAuthCookie(res: Response, userId: number) {
  res.cookie(AUTH_COOKIE, signToken(userId), {
    httpOnly: true,
    sameSite: 'lax',
    secure: EnvVars.CookieSecure,
    maxAge: THIRTY_DAYS_MS,
  });
}

/**
 * Đăng ký tài khoản.
 *
 * @route POST /api/auth/register
 */
async function register(req: Request, res: Response) {
  const { email, password, name } = reqValidators.register(req.body);
  const userId = await AuthService.register(email, password, name);
  setAuthCookie(res, userId);
  const user = await AuthService.getMe(userId);
  res.status(HttpStatusCodes.CREATED).json({ user });
}

/**
 * Đăng nhập.
 *
 * @route POST /api/auth/login
 */
async function login(req: Request, res: Response) {
  const { email, password } = reqValidators.login(req.body);
  const userId = await AuthService.login(email, password);
  setAuthCookie(res, userId);
  const user = await AuthService.getMe(userId);
  res.status(HttpStatusCodes.OK).json({ user });
}

/**
 * Đăng xuất.
 *
 * @route POST /api/auth/logout
 */
function logout(_: Request, res: Response) {
  res.clearCookie(AUTH_COOKIE);
  res.status(HttpStatusCodes.OK).json({ ok: true });
}

/**
 * Lấy thông tin user hiện tại.
 *
 * @route GET /api/auth/me
 */
async function me(_: Request, res: Response) {
  const user = await AuthService.getMe(getUserId(res));
  res.status(HttpStatusCodes.OK).json({ user });
}

/******************************************************************************
                            Export default
******************************************************************************/

export default {
  register,
  login,
  logout,
  me,
} as const;
