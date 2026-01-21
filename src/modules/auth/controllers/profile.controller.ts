import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '@/shared/utils/response.util';
import prisma from '@/config/database.config';
import { AppError } from '@/shared/middleware/errorHandler';

class ProfileController {
  /**
   * Get current user profile
   */
  async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError('User not authenticated', 401);
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
        select: {
          id: true,
          universityId: true,
          name: true,
          email: true,
          phone: true,
          photo: true,
          role: true,
          accountStatus: true,
          department: true,
          year: true,
          program: true,
          session: true,
          bloodGroup: true,
          currentRoom: {
            select: {
              id: true,
              roomNumber: true,
              floor: true,
              wing: true,
              roomType: true,
            },
          },
          emergencyContacts: true,
          guardianInfo: true,
          createdAt: true,
        },
      });

      if (!user) {
        throw new AppError('User not found', 404);
      }

      sendSuccess(res, user, 'Profile retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user by ID (admin only)
   */
  async getUserByUniversityId(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { universityId } = req.params;

      // Ensure universityId is a string
      if (!universityId || typeof universityId !== 'string') {
        throw new AppError('Invalid user ID', 400);
      }

      const user = await prisma.user.findUnique({
        where: { universityId },
        select: {
          id: true,
          universityId: true,
          name: true,
          email: true,
          phone: true,
          photo: true,
          role: true,
          accountStatus: true,
          department: true,
          year: true,
          program: true,
          session: true,
          bloodGroup: true,
          currentRoom: {
            select: {
              id: true,
              roomNumber: true,
              floor: true,
              wing: true,
              roomType: true,
            },
          },
          createdAt: true,
        },
      });

      if (!user) {
        throw new AppError('User not found', 404);
      }

      sendSuccess(res, user, 'User retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}

export default new ProfileController();
