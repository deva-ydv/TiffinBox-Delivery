import { Response, NextFunction } from 'express';
import { AuthRequest } from './authenticate';
import { ApiError } from '../utils/ApiError';
import { Role } from '@prisma/client';

export const authorize =
  (...roles: Role[]) =>
  (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new ApiError(403, 'You do not have permission to access this resource'));
    }
    next();
  };
