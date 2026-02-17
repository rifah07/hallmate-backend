import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';
import { AppError, ForbiddenError, UnauthorizedError } from '../errors';

/**
 * Authorization middleware - checks if user has required role(s)
 */
export const authorize = (...allowedRoles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'));
    }
    const hasRole = allowedRoles.includes(req.user.role as UserRole);

    if (!hasRole) {
      return next(new ForbiddenError('You do not have permission to perform this action'));
    }

    next();
  };
};

/**
 * Check if user is accessing their own resource
 */
export const authorizeOwner = (req: Request, _res: Response, next: NextFunction): void => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    // Get userId from params or body
    const targetUserId = req.params.userId || req.params.id || req.body.userId;

    // Super admin and provost can access any resource
    if (req.user.role === 'SUPER_ADMIN' || req.user.role === 'PROVOST') {
      return next();
    }

    // Check if user is accessing their own resource
    if (req.user.userId !== targetUserId) {
      throw new AppError('You can only access your own resources', 403);
    }

    next();
  } catch (error) {
    next(error);
  }
};
