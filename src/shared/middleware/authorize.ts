import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';
import { BadRequestError, ForbiddenError, UnauthorizedError } from '../errors';

/**
 * Authorization middleware - checks if user has required role(s)
 */
/* export const authorize = (...allowedRoles: UserRole[]) => {
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
}; */

export const authorize = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { message: 'Authentication required' },
      });
      return;
    }

    const hasRole = allowedRoles.includes(req.user.role as UserRole);

    if (!hasRole) {
      res.status(403).json({
        success: false,
        error: { message: 'You do not have permission to perform this action' },
      });
      return;
    }

    next();
  };
};

/**
 * Check if user is accessing their own resource
 */
export const authorizeOwner = (req: Request, _res: Response, next: NextFunction): void => {
  if (!req.user) {
    return next(new UnauthorizedError('Authentication required'));
  }

  // Get userId from params or body
  const targetUserId = req.params.userId || req.params.id || req.body.userId;
  if (!targetUserId) {
    return next(new BadRequestError('Target user ID not found in request'));
  }

  // Super admin and provost can access any resource
  if (req.user.role === 'SUPER_ADMIN' || req.user.role === 'PROVOST') {
    return next();
  }

  // Check if user is accessing their own resource
  if (req.user.userId !== targetUserId) {
    return next(new ForbiddenError('You can only access your own resources'));
  }

  next();
};
