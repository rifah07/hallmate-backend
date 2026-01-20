import { Request, Response, NextFunction } from 'express';
import { z, ZodError, ZodIssue } from 'zod';
import { sendError } from '@/shared/utils/response.util';

export const validate =
  (schema: z.ZodTypeAny) =>
  async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.issues.map((issue: ZodIssue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        }));

        sendError(
          res,
          'Validation failed',
          400,
          'VALIDATION_ERROR',
          errors,
        );
        return;
      }

      return next(error);
    }
  };
