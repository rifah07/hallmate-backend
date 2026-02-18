import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '@/shared/utils/response.util';
import profileRepository from '../repositories/profile.repository';
import { BadRequestError, NotFoundError, UnauthorizedError } from '@/shared/errors';

class ProfileController {
  /**
   * Get current user profile
   */
  async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('User not authenticated');
      }

      const profile = await profileRepository.getProfileById(req.user.userId);

      if (!profile) {
        throw new NotFoundError('User not found');
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
        throw new BadRequestError('Invalid user ID');
      }

      const user = await profileRepository.getUserByUniversityId(universityId);
      if (!user) {
        throw new NotFoundError('User not found');
      }

      sendSuccess(res, user, 'User retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}

export default new ProfileController();
