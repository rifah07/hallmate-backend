import { Request, Response, NextFunction } from 'express';
import mealService from '../services/meal.service';
import { sendSuccess } from '@/shared/utils/response.util';
import { UserContext } from '../types/meal.types';

class MealController {
  async updateMealLog(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userContext: UserContext = {
        userId: req.user!.userId,
        role: req.user!.role,
        assignedFloor: req.user!.assignedFloor,
      };

      const mealLog = await mealService.updateMealLog(
        String(req.params.studentId),
        String(req.params.date),
        req.body,
        userContext,
      );

      sendSuccess(res, mealLog, 'Meal log updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async bulkUpdateMealLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userContext: UserContext = {
        userId: req.user!.userId,
        role: req.user!.role,
        assignedFloor: req.user!.assignedFloor,
      };

      const mealLogs = await mealService.bulkUpdateMealLogs(req.body, userContext);

      sendSuccess(res, { mealLogs, count: mealLogs.length }, 'Meal logs updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async getAllMealLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters = {
        studentId: req.query.studentId as string | undefined,
        date: req.query.date ? new Date(req.query.date as string) : undefined,
        dateFrom: req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined,
        dateTo: req.query.dateTo ? new Date(req.query.dateTo as string) : undefined,
        breakfast: req.query.breakfast ? req.query.breakfast === 'true' : undefined,
        lunch: req.query.lunch ? req.query.lunch === 'true' : undefined,
        dinner: req.query.dinner ? req.query.dinner === 'true' : undefined,
        floor: req.query.floor ? parseInt(req.query.floor as string, 10) : undefined,
        roomNumber: req.query.roomNumber as string | undefined,
      };

      const pagination = {
        page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 50,
        sortBy: req.query.sortBy as string | undefined,
        sortOrder: req.query.sortOrder as 'asc' | 'desc' | undefined,
      };

      const userContext: UserContext = {
        userId: req.user!.userId,
        role: req.user!.role,
        assignedFloor: req.user!.assignedFloor,
      };

      const result = await mealService.getMealLogs(filters, pagination, userContext);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }
}

export default new MealController();
