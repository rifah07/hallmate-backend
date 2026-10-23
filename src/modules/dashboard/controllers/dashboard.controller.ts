import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '@/shared/utils/response.util';
import dashboardService from '../services/dashboard.service';

class DashboardController {
  async get(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      sendSuccess(res, await dashboardService.forUser(req.user!));
    } catch (error) {
      next(error);
    }
  }
}

export default new DashboardController();
