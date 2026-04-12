import { Request, Response, NextFunction } from 'express';
import applicationService from '../services/application.service';
import { sendSuccess } from '@/shared/utils/response.util';
import { UserContext } from '../types/application.types';
import { UserRole } from '@prisma/client';

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

  async getAllApplications(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters = {
        type: req.query.type as any,
        status: req.query.status as any,
        studentId: req.query.studentId as string | undefined,
        assignedTo: req.query.assignedTo as string | undefined,
        assignedToRole: req.query.assignedToRole as UserRole,
        dateFrom: req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined,
        dateTo: req.query.dateTo ? new Date(req.query.dateTo as string) : undefined,
      };

      const pagination = {
        page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 20,
        sortBy: req.query.sortBy as string | undefined,
        sortOrder: req.query.sortOrder as 'asc' | 'desc' | undefined,
      };

      const userContext: UserContext = {
        userId: req.user!.userId,
        role: req.user!.role,
        assignedFloor: req.user!.assignedFloor,
      };

      const result = await applicationService.getApplications(filters, pagination, userContext);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }
}

export default new ApplicationController();
