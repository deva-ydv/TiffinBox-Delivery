import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { ApiError } from '../utils/ApiError';
import { prisma } from '../config/db';
import { Role } from '@prisma/client';

export interface AuthRequest extends Request {
  user?: { id: string; role: Role; email: string };
}

export const authenticate = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) => {
  try {
    // const token = req.headers.authorization?.split(' ')[1];
    const token = req.cookies?.accessToken;
    if (!token) return next(new ApiError(401, 'No token provided'));

    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as {
      id: string;
      role: Role;
      email: string;
    };

    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user) return next(new ApiError(401, 'User not found'));

    req.user = { id: user.id, role: user.role, email: user.email };
    next();
  } catch {
    next(new ApiError(401, 'Invalid or expired token'));
  }
};
