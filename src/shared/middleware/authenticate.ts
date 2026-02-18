/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/crypto/jwt.util';
import { ForbiddenError, TokenError, UnauthorizedError } from '@/shared/errors';
import prisma from '@/config/database.config';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';

// Statuses that must be refused even with a valid token
const BLOCKED_STATUSES = ['SUSPENDED', 'SEAT_CANCELLED', 'INACTIVE', 'GRADUATED'] as const;

export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Authentication token missing or malformed');
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      throw new UnauthorizedError('No token provided');
    }

    // verify token
    const decoded = verifyAccessToken(token);

    // Check if user still exists
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        universityId: true,
        role: true,
        accountStatus: true,
        isDeleted: true,
        passwordChangedAt: true,
      },
    });

    // Account deleted after token was issued
    if (!user || user.isDeleted) {
      throw new UnauthorizedError('Account no longer exists');
    }

    if (user.passwordChangedAt && decoded.iat) {
      const changedAt = Math.floor(user.passwordChangedAt.getTime() / 1000);
      if (decoded.iat < changedAt) {
        throw new UnauthorizedError('Password recently changed. Please log in again.');
      }
    }
    // Account status changed after token was issued — single check, all statuses
    if (BLOCKED_STATUSES.includes(user.accountStatus as any)) {
      throw new ForbiddenError('Your account is not active. Please contact the hall office.');
    }

    // Attach user to request
    req.user = {
      userId: user.id,
      universityId: user.universityId,
      role: user.role,
      accountStatus: user.accountStatus,
    };
    next();
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      next(new TokenError('Token expired. Please log in again.'));
    } else if (error instanceof JsonWebTokenError) {
      next(new TokenError('Invalid token. Please log in again.'));
    } else {
      next(error);
    }
  }
};
