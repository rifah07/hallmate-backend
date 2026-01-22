import { Request, Response, NextFunction } from 'express';
import authService from '../services/auth.service';
import { sendSuccess } from '@/shared/utils/response.util';
import { AppError } from '@/shared/middleware/errorHandler';

class AuthController {
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.login(req.body);

      // Set refresh token as httpOnly cookie
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      sendSuccess(
        res,
        {
          user: result.user,
          accessToken: result.accessToken,
        },
        'Login successful',
      );
    } catch (error) {
      next(error);
    }
  }

  async firstTimeLogin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.firstTimeLogin(req.body);

      // Set refresh token as httpOnly cookie
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      sendSuccess(
        res,
        {
          user: result.user,
          accessToken: result.accessToken,
        },
        'Password set successfully. Welcome!',
      );
    } catch (error) {
      next(error);
    }
  }

  async logout(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Clear refresh token cookie
      res.clearCookie('refreshToken');

      sendSuccess(res, null, 'Logged out successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Forgot Password
   */
  async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.forgotPassword(req.body);
      sendSuccess(res, null, result.message);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reset Password
   */
  async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.resetPassword(req.body);
      sendSuccess(res, null, result.message);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Change Password
   */
  async changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError('User not authenticated', 401);
      }

      const result = await authService.changePassword(req.user.userId, req.body);
      sendSuccess(res, null, result.message);
    } catch (error) {
      next(error);
    }
  }
}

export default new AuthController();
