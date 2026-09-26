import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { AppError } from '../utils/AppError';

export const requireRole = (...roles: Role[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(
          `Forbidden. Required roles: ${roles.join(', ')}. Your role: ${req.user.role}`,
          403
        )
      );
    }

    next();
  };
};
