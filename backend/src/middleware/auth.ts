import { Request, Response, NextFunction } from 'express';
import { config } from '../config/environment';
import { AppError } from '../utils/AppError';
import { verifyToken, TokenPayload } from '../utils/jwt';

const extractTokenFromHeader = (req: Request): string | null => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }
  return null;
};

const extractTokenFromCookies = (req: Request): string | null => {
  return req.cookies?.accessToken || null;
};

export const authMiddleware = (req: Request, _res: Response, next: NextFunction) => {
  const token = extractTokenFromHeader(req) || extractTokenFromCookies(req);

  if (!token) {
    return next(new AppError('Authentication required. No token provided.', 401));
  }

  try {
    const payload = verifyToken<TokenPayload>(token, config.JWT_ACCESS_SECRET);
    req.user = {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
    };
    next();
  } catch {
    return next(new AppError('Invalid or expired token.', 401));
  }
};

export const optionalAuthMiddleware = (req: Request, _res: Response, next: NextFunction) => {
  const token = extractTokenFromHeader(req) || extractTokenFromCookies(req);

  if (!token) {
    return next();
  }

  try {
    const payload = verifyToken<TokenPayload>(token, config.JWT_ACCESS_SECRET);
    req.user = {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
    };
  } catch {
    // Token invalid but optional, continue without user
  }

  next();
};
