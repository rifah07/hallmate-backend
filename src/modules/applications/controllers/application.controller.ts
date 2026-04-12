import { Request, Response, NextFunction } from 'express';
import applicationService from '../services/application.service';
import { sendSuccess } from '@/shared/utils/response.util';
import { UserContext } from '../types/application.types';

class ApplicationController {
  async createApplication(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userContext: UserContext = {
        userId: req.user!.userId,
        role: req.user!.role,
        assignedFloor: req.user!.assignedFloor,
      };

      const application = await applicationService.createApplication(req.body, userContext);
      sendSuccess(res, application, 'Application submitted successfully', 201);
    } catch (error) {
      next(error);
    }
  }
}

export default new ApplicationController();
