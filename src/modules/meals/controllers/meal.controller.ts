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
  async getMealLogByDate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userContext: UserContext = {
        userId: req.user!.userId,
        role: req.user!.role,
        assignedFloor: req.user!.assignedFloor,
      };

      const mealLog = await mealService.getMealLogByDate(
        String(req.params.studentId),
        String(req.params.date),
        userContext,
      );

      if (!mealLog) {
        sendSuccess(res, null, 'No meal log found for this date');
        return;
      }

      sendSuccess(res, mealLog);
    } catch (error) {
      next(error);
    }
  }

  async getMyMealLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dateFrom = req.query.dateFrom as string;
      const dateTo = req.query.dateTo as string;

      if (!dateFrom || !dateTo) {
        throw new Error('dateFrom and dateTo query parameters are required');
      }

      const userContext: UserContext = {
        userId: req.user!.userId,
        role: req.user!.role,
        assignedFloor: req.user!.assignedFloor,
      };

      const history = await mealService.getMyMealLogs(dateFrom, dateTo, userContext);
      sendSuccess(res, history);
    } catch (error) {
      next(error);
    }
  }

  async getStatisticsByDate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userContext: UserContext = {
        userId: req.user!.userId,
        role: req.user!.role,
        assignedFloor: req.user!.assignedFloor,
      };

      const statistics = await mealService.getStatisticsByDate(
        String(req.params.date),
        userContext,
      );

      sendSuccess(res, statistics);
    } catch (error) {
      next(error);
    }
  }
  async getMonthlyMealSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userContext: UserContext = {
        userId: req.user!.userId,
        role: req.user!.role,
        assignedFloor: req.user!.assignedFloor,
      };

      const summary = await mealService.getMonthlyMealSummary(
        String(req.params.studentId),
        parseInt(String(req.params.month), 10),
        parseInt(String(req.params.year), 10),
        userContext,
      );

      sendSuccess(res, summary);
    } catch (error) {
      next(error);
    }
  }
}

export default new MealController();
