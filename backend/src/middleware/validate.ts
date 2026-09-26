import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodSchema } from 'zod';

interface ValidationSchemas {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

export const validateRequest = (schemas: ValidationSchemas) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (schemas.body) {
      schemas.body.parse(req.body);
    }
    if (schemas.query) {
      schemas.query.parse(req.query);
    }
    if (schemas.params) {
      schemas.params.parse(req.params);
    }
    next();
  };
};
