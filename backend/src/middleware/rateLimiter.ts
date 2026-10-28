import { rateLimit, ipKeyGenerator } from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';

const buildHandler =
  (message: string) => (_req: Request, _res: Response, next: NextFunction) =>
    next(new ApiError(429, message));

const common = {
  standardHeaders: 'draft-7' as const,
  legacyHeaders: false,
};

// Login: 5 failed attempts per 15 min, per IP + email
export const loginLimiter = rateLimit({
  ...common,
  windowMs: 15 * 60 * 1000,
  limit: 5,
  skipSuccessfulRequests: true,
  keyGenerator: (req: Request) =>
    `${ipKeyGenerator(req.ip ?? '')}:${String(req.body?.email ?? '').toLowerCase()}`,
  handler: buildHandler('Too many login attempts, please try again after 15 minutes'),
});

// Register: 5 per hour per IP
export const registerLimiter = rateLimit({
  ...common,
  windowMs: 60 * 60 * 1000,
  limit: 5,
  handler: buildHandler('Too many accounts created, please try again later'),
});

// Refresh token: 20 per 15 min per IP
export const refreshLimiter = rateLimit({
  ...common,
  windowMs: 15 * 60 * 1000,
  limit: 20,
  handler: buildHandler('Too many token refresh requests, please try again later'),
});