import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/crypto/jwt.util';
import { AppError } from '@/shared/middleware/errorHandler';
import prisma from '@/config/database.config';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        universityId: string;
        role: string;
        accountStatus: string;
      };
    }
  }
}

export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Authentication token missing or malformed', 401);
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      throw new AppError('No token provided', 402);
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
      },
    });

    if (!user) {
      throw new AppError('User no longer exists', 401);
    }

    // Check if user is deleted
    if (user.isDeleted) {
      throw new AppError('User account has been deleted', 401);
    }

    // Check account status
    if (user.accountStatus === 'SUSPENDED') {
      throw new AppError('Your account has been suspended', 403);
    }

    if (user.accountStatus === 'SEAT_CANCELLED') {
      throw new AppError('Your seat has been cancelled', 403);
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
    if (error instanceof AppError) {
      next(error);
    } else if ((error as any).name === 'JsonWebTokenError') {
      next(new AppError('Invalid token. Please log in again.', 401));
    } else if ((error as any).name === 'TokenExpiredError') {
      next(new AppError('Token expired. Please log in again.', 401));
    } else {
      next(error);
    }
  }
};
