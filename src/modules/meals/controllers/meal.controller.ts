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
}

export default new MealController();
