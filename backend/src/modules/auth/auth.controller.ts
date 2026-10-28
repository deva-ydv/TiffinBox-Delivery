// import { Request, Response, NextFunction } from 'express';
// import * as authService from './auth.service';
// import { ApiResponse } from '../../utils/ApiResponse';
// import { AuthRequest } from '../../middleware/authenticate';

// export const register = async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     const result = await authService.register(req.body);
//     res.status(201).json(new ApiResponse(201, result, 'Registered successfully'));
//   } catch (err) {
//     next(err);
//   }
// };

// export const login = async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     const result = await authService.login(req.body);
//     res.json(new ApiResponse(200, result, 'Logged in successfully'));
//   } catch (err) {
//     next(err);
//   }
// };

// export const refresh = async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     const { refreshToken } = req.body;
//     const tokens = await authService.refresh(refreshToken);
//     res.json(new ApiResponse(200, tokens, 'Token refreshed successfully'));
//   } catch (err) {
//     next(err);
//   }
// };

// export const logout = async (req: AuthRequest, res: Response, next: NextFunction) => {
//   try {
//     await authService.logout(req.user!.id);
//     res.json(new ApiResponse(200, null, 'Logged out successfully'));
//   } catch (err) {
//     next(err);
//   }
// };

// export const getProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
//   try {
//     const user = await authService.getProfile(req.user!.id);
//     res.json(new ApiResponse(200, user, 'Profile fetched'));
//   } catch (err) {
//     next(err);
//   }
// };

// export const updateProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
//   try {
//     const user = await authService.updateProfile(req.user!.id, req.body);
//     res.json(new ApiResponse(200, user, 'Profile updated'));
//   } catch (err) {
//     next(err);
//   }
// };


import { Request, Response, NextFunction } from 'express';
import * as authService from './auth.service';
import { ApiResponse } from '../../utils/ApiResponse';
import { ApiError } from '../../utils/ApiError';
import { AuthRequest } from '../../middleware/authenticate';
import { setAuthCookies, clearAuthCookies } from '../../utils/cookies';

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { accessToken, refreshToken, ...data } = await authService.register(req.body);
    setAuthCookies(res, { accessToken, refreshToken });
    res.status(201).json(new ApiResponse(201, data, 'Registered successfully'));
  } catch (err) {
    next(err);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { accessToken, refreshToken, ...data } = await authService.login(req.body);
    setAuthCookies(res, { accessToken, refreshToken });
    res.json(new ApiResponse(200, data, 'Logged in successfully'));
  } catch (err) {
    next(err);
  }
};

export const refresh = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) throw new ApiError(401, 'No refresh token provided');

    const tokens = await authService.refresh(token);
    setAuthCookies(res, tokens);
    res.json(new ApiResponse(200, null, 'Token refreshed successfully'));
  } catch (err) {
    clearAuthCookies(res);
    next(err);
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies?.refreshToken;
    if (token) await authService.logoutByToken(token);
    clearAuthCookies(res);
    res.json(new ApiResponse(200, null, 'Logged out successfully'));
  } catch (err) {
    next(err);
  }
};

export const getProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await authService.getProfile(req.user!.id);
    res.json(new ApiResponse(200, user, 'Profile fetched'));
  } catch (err) {
    next(err);
  }
};

export const updateProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await authService.updateProfile(req.user!.id, req.body);
    res.json(new ApiResponse(200, user, 'Profile updated'));
  } catch (err) {
    next(err);
  }
};