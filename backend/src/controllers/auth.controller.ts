import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import {
  createUser,
  verifyUserCredentials,
  createSession,
  revokeRefreshToken,
  refreshAccessToken,
  getUserById,
} from '../services/auth.service';
import { config } from '../config/environment';
import { AppError } from '../utils/AppError';

const setRefreshCookie = (res: Response, refreshToken: string) => {
  const daysMatch = config.JWT_REFRESH_EXPIRES_IN.match(/^(\d+)d$/);
  const maxAge = daysMatch
    ? parseInt(daysMatch[1], 10) * 24 * 60 * 60 * 1000
    : 7 * 24 * 60 * 60 * 1000;

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: config.NODE_ENV === 'production',
    sameSite: config.NODE_ENV === 'production' ? 'strict' : 'lax',
    maxAge,
    path: '/',
  });
};

const clearRefreshCookie = (res: Response) => {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: config.NODE_ENV === 'production',
    sameSite: config.NODE_ENV === 'production' ? 'strict' : 'lax',
    path: '/',
  });
};

export const register = asyncHandler(async (req: Request, res: Response) => {
  const result = await createUser(req.body);

  setRefreshCookie(res, result.tokens.refreshToken);

  res.status(201).json({
    success: true,
    data: {
      user: result.user,
      tokens: result.tokens,
    },
  });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const user = await verifyUserCredentials(req.body);
  const result = await createSession(user);

  setRefreshCookie(res, result.tokens.refreshToken);

  res.status(200).json({
    success: true,
    data: {
      user: result.user,
      tokens: result.tokens,
    },
  });
});

export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const refreshTokenValue = req.body.refreshToken || req.cookies?.refreshToken;

  if (!refreshTokenValue) {
    throw new AppError('Refresh token is required.', 400);
  }

  const tokens = await refreshAccessToken(refreshTokenValue);

  setRefreshCookie(res, tokens.refreshToken);

  res.status(200).json({
    success: true,
    data: tokens,
  });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const refreshTokenValue = req.body.refreshToken || req.cookies?.refreshToken;

  if (refreshTokenValue) {
    try {
      await revokeRefreshToken(refreshTokenValue, req.user?.userId);
    } catch {
      // If token doesn't exist or already revoked, still complete logout
    }
  }

  clearRefreshCookie(res);

  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
});

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError('Authentication required.', 401);
  }

  const user = await getUserById(req.user.userId);

  res.status(200).json({
    success: true,
    data: user,
  });
});
