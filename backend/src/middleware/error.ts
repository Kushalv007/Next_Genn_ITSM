import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import { config } from '../config/environment';
import { ZodError } from 'zod';

export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  let statusCode = 500;
  let message = 'Internal Server Error';
  let isOperational = false;
  let stack: string | undefined;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    isOperational = err.isOperational;
  } else if (err instanceof ZodError) {
    statusCode = 400;
    isOperational = true;
    const issues = err.issues.map(
      (issue) => `${issue.path.join('.')}: ${issue.message}`
    );
    message = issues.join('; ') || 'Validation failed';
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
    isOperational = true;
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Session has expired. Please login again.';
    isOperational = true;
  } else if (err.code === 'P2002') {
    statusCode = 409;
    message = `Duplicate field value: ${err.meta?.target?.join(', ')}`;
    isOperational = true;
  } else if (err.code === 'P2025') {
    statusCode = 404;
    message = 'Record not found';
    isOperational = true;
  }

  if (config.NODE_ENV === 'development') {
    stack = err.stack;
  }

  res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    ...(stack ? { stack } : {}),
  });
};
