import bcrypt from 'bcryptjs';
// import jwt from 'jsonwebtoken';
import jwt, { type SignOptions } from 'jsonwebtoken';
import type { StringValue } from 'ms';
import { prisma } from '../../config/db';
import { env } from '../../config/env';
import { ApiError } from '../../utils/ApiError';
import { RegisterInput, LoginInput } from './auth.schema';
import { Role } from '@prisma/client';


interface TokenPayload {
  id: string;
  role: Role;
  email: string;
}

// const generateTokens = (payload: TokenPayload) => {
//   const accessToken = jwt.sign(payload, env.JWT_ACCESS_SECRET, {
//     expiresIn: env.JWT_ACCESS_EXPIRES_IN,
//   });
//   const refreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET, {
//     expiresIn: env.JWT_REFRESH_EXPIRES_IN,
//   });
//   return { accessToken, refreshToken };
// };

const generateTokens = (payload: TokenPayload) => {
  const accessOptions: SignOptions = {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as StringValue,
  };

  const refreshOptions: SignOptions = {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as StringValue,
  };

  const accessToken = jwt.sign(
    payload,
    env.JWT_ACCESS_SECRET,
    accessOptions,
  );

  const refreshToken = jwt.sign(
    payload,
    env.JWT_REFRESH_SECRET,
    refreshOptions,
  );

  return { accessToken, refreshToken };
};


export const register = async (data: RegisterInput) => {
  const exists = await prisma.user.findUnique({ where: { email: data.email } });
  if (exists) throw new ApiError(409, 'Email already in use');

  const hashedPassword = await bcrypt.hash(data.password, 12);
  const user = await prisma.user.create({
    data: { ...data, password: hashedPassword },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

  const tokens = generateTokens({ id: user.id, role: user.role, email: user.email });
  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken: tokens.refreshToken },
  });

  return { user, ...tokens };
};

export const login = async (data: LoginInput) => {
  const user = await prisma.user.findUnique({ where: { email: data.email } });
  if (!user) throw new ApiError(401, 'Invalid email or password');

  const isValid = await bcrypt.compare(data.password, user.password);
  if (!isValid) throw new ApiError(401, 'Invalid email or password');

  const tokens = generateTokens({ id: user.id, role: user.role, email: user.email });
  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken: tokens.refreshToken },
  });

  const { password, refreshToken, ...safeUser } = user;
  return { user: safeUser, ...tokens };
};

export const refresh = async (token: string) => {
  try {
    const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET) as TokenPayload;
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });

    if (!user || user.refreshToken !== token) {
      throw new ApiError(401, 'Invalid refresh token');
    }

    const tokens = generateTokens({ id: user.id, role: user.role, email: user.email });
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: tokens.refreshToken },
    });

    return tokens;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(401, 'Invalid or expired refresh token');
  }
};

export const logout = async (userId: string) => {
  await prisma.user.update({
    where: { id: userId },
    data: { refreshToken: null },
  });
};

export const getProfile = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: true, phone: true, address: true, createdAt: true },
  });
  if (!user) throw new ApiError(404, 'User not found');
  return user;
};

export const updateProfile = async (userId: string, data: { name?: string; phone?: string; address?: string }) => {
  return prisma.user.update({
    where: { id: userId },
    data,
    select: { id: true, name: true, email: true, role: true, phone: true, address: true },
  });
};

export const logoutByToken = async (token: string) => {
  try {
    const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET) as TokenPayload;
    await prisma.user.updateMany({
      where: { id: decoded.id, refreshToken: token },
      data: { refreshToken: null },
    });
  } catch {
    // invalid or expired token: nothing to revoke
  }
};