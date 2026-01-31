import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '@/shared/utils/response.util';
import prisma from '@/config/database.config';
import { AppError } from '@/shared/middleware/errorHandler';
import authRepository from '../repositories/auth.repository';

class ProfileController {
  /**
   * Get current user profile
   */
  async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError('User not authenticated', 401);
      }

      const profile = await authRepository.findById(req.user.userId);

      if (!profile) {
        throw new AppError('User not found', 404);
      }

      sendSuccess(res, profile, 'Profile retrieved successfully');
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

      const user = await authRepository.findByUniversityId(universityId);
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
