/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextFunction } from 'express';

/**
 * Handle async errors (wrapper for async route handlers)
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>,
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
