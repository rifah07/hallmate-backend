import { Request, Response, NextFunction } from 'express';
import userService from '../services/user.service';
import { sendSuccess } from '@/shared/utils/response.util';

class UserController {
  constructor() {
    this.getUserById = this.getUserById.bind(this);
    this.getUserByUniversityId = this.getUserByUniversityId.bind(this);
  }

  /**
   * GET /api/users/:userId
   */
  async getUserById(
    req: Request<{ userId: string }>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { userId } = req.params;
      const user = await userService.getUserById(userId);
      sendSuccess(res, user, 'User retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/users/university/:universityId
   */
  async getUserByUniversityId(
    req: Request<{ universityId: string }>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { universityId } = req.params;
      const user = await userService.getUserByUniversityId(universityId);
      sendSuccess(res, user, 'User retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}

export default new UserController();
