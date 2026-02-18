import { Request, Response, NextFunction } from 'express';
import authService from '../services/auth.service';
import { sendSuccess } from '@/shared/utils/response.util';
import { UnauthorizedError } from '@/shared/errors';

class AuthController {
  private readonly cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: (process.env.NODE_ENV === 'production' ? 'none' : 'strict') as 'none' | 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.login(req.body);
      res.cookie('refreshToken', result.refreshToken, this.cookieOptions);
      sendSuccess(res, { user: result.user, accessToken: result.accessToken }, 'Login successful');
    } catch (error) {
      next(error);
    }
  }

  async firstTimeLogin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.firstTimeLogin(req.body);
      res.cookie('refreshToken', result.refreshToken, this.cookieOptions);
      sendSuccess(
        res,
        { user: result.user, accessToken: result.accessToken },
        'Password set successfully. Welcome!',
      );
    } catch (error) {
      next(error);
    }
  }

  async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const refreshToken = req.cookies?.refreshToken;

      if (!refreshToken) {
        throw new UnauthorizedError('Refresh token missing');
      }

      const result = await authService.refreshToken(refreshToken);

      // Set new refresh token cookie
      res.cookie('refreshToken', result.refreshToken, this.cookieOptions);

      sendSuccess(res, { accessToken: result.accessToken }, 'Token refreshed successfully');
    } catch (error) {
      next(error);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const refreshToken = req.cookies?.refreshToken;

      if (refreshToken) {
        await authService.logout(refreshToken);
      }

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
        throw new UnauthorizedError('User not authenticated');
      }

      const result = await authService.changePassword(req.user.userId, req.body);
      sendSuccess(res, null, result.message);
    } catch (error) {
      next(error);
    }
  }
}

export default new AuthController();
