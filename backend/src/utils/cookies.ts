import { CookieOptions, Response } from 'express';
import { env } from '../config/env';

const baseOptions: CookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax',
};

// Keep these in sync with JWT_ACCESS_EXPIRES_IN / JWT_REFRESH_EXPIRES_IN
const ACCESS_MAX_AGE = 15 * 60 * 1000; // 15 minutes
const REFRESH_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days
const REFRESH_PATH = '/api/v1/auth'; // refresh cookie is only sent to auth routes

export const setAuthCookies = (
  res: Response,
  tokens: { accessToken: string; refreshToken: string }
) => {
  res.cookie('accessToken', tokens.accessToken, {
    ...baseOptions,
    maxAge: ACCESS_MAX_AGE,
  });
  res.cookie('refreshToken', tokens.refreshToken, {
    ...baseOptions,
    maxAge: REFRESH_MAX_AGE,
    path: REFRESH_PATH,
  });
};

export const clearAuthCookies = (res: Response) => {
  res.clearCookie('accessToken', baseOptions);
  res.clearCookie('refreshToken', { ...baseOptions, path: REFRESH_PATH });
};