import { Request, Response, NextFunction } from 'express';
import authService from '../services/auth.service';
import { sendSuccess } from '@/shared/utils/response.util';

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
}

export default new AuthController();
