import jwt, { SignOptions } from 'jsonwebtoken';
import { config } from '../config/environment';
import { Role } from '@prisma/client';

export interface TokenPayload {
  userId: string;
  email: string;
  role: Role;
}

export const signAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, config.JWT_ACCESS_SECRET, {
    expiresIn: config.JWT_ACCESS_EXPIRES_IN as SignOptions['expiresIn'],
  });
};

export const signRefreshToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, config.JWT_REFRESH_SECRET, {
    expiresIn: config.JWT_REFRESH_EXPIRES_IN as SignOptions['expiresIn'],
  });
};

export const verifyToken = <T = TokenPayload>(
  token: string,
  secret: string
): T => {
  return jwt.verify(token, secret) as T;
};

export const generateTokenPair = (payload: TokenPayload): { accessToken: string; refreshToken: string } => {
  return {
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload),
  };
};

export const parseExpiresIn = (expiresIn: string): Date => {
  const match = expiresIn.match(/^(\d+)([smhd])$/);
  if (!match) {
    return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  }
  const value = parseInt(match[1], 10);
  const unit = match[2];
  const now = Date.now();
  switch (unit) {
    case 's':
      return new Date(now + value * 1000);
    case 'm':
      return new Date(now + value * 60 * 1000);
    case 'h':
      return new Date(now + value * 60 * 60 * 1000);
    case 'd':
      return new Date(now + value * 24 * 60 * 60 * 1000);
    default:
      return new Date(now + 7 * 24 * 60 * 60 * 1000);
  }
};
