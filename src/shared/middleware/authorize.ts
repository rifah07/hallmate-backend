import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler';
import { UserRole } from '@prisma/client';

/**
 * Authorization middleware - checks if user has required role(s)
 */
export const authorize = (...allowedRoles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        throw new AppError('Authentication required', 401);
      }

      // Check if user has required role
      const hasRole = allowedRoles.includes(req.user.role as UserRole);

      if (!hasRole) {
        throw new AppError('You do not have permission to access this resource', 403);
      }
      next();
    } catch (error) {
      next(error);
    }
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
