import { Request, Response, NextFunction } from 'express';
import { z, ZodError, ZodIssue } from 'zod';
import { sendError } from '@/shared/utils/response.util';

type RequestSource = 'body' | 'query' | 'params' | 'all';

export const validate =
  (schema: z.ZodTypeAny, source: RequestSource = 'all', customMessage?: string) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dataToValidate =
        source === 'all' ? { body: req.body, query: req.query, params: req.params } : req[source];

      const parsed = (await schema.parseAsync(dataToValidate)) as Record<string, any>;

      if (source === 'all') {
        req.body = parsed.body;
        req.params = parsed.params;
        Object.defineProperty(req, 'query', {
          value: parsed.query,
          writable: true,
          configurable: true,
        });
      } else if (source === 'query') {
        Object.defineProperty(req, 'query', {
          value: parsed,
          writable: true,
          configurable: true,
        });
      } else {
        (req as any)[source] = parsed;
      }

      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.issues.map((issue: ZodIssue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        }));

        const message = customMessage ?? 'Validation failed';
        sendError(res, message, 400, 'VALIDATION_ERROR', errors);
        return;
      }

      return next(error);
    }
  };
