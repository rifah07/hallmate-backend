import { Request, Response, NextFunction } from 'express';
import mealCancellationService from '../services/meal-cancellation.service';
import { sendSuccess } from '@/shared/utils/response.util';

class MealCancellationController {
  /**
   * Cancel meals (Student)
   * POST /api/meals/cancel
   */
  async cancelMeals(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await mealCancellationService.cancelMeals(req.user!.userId, req.body);

      sendSuccess(res, result, 'Meal cancellation processed');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reactivate meals (Student)
   * POST /api/meals/reactivate
   */
  async reactivateMeals(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await mealCancellationService.reactivateMeals(
        req.user!.userId,
        req.body.dates,
        req.body.mealTypes,
      );

      sendSuccess(res, result, 'Meals reactivated successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get my meal status (Student)
   * GET /api/meals/my-status?dateFrom=YYYY-MM-DD&dateTo=YYYY-MM-DD
   */
  async getMyMealStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dateFrom = new Date(req.query.dateFrom as string);
      const dateTo = new Date(req.query.dateTo as string);

      const status = await mealCancellationService.getStudentMealStatus(
        req.user!.userId,
        dateFrom,
        dateTo,
      );

      sendSuccess(res, status);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get meal planning report (Staff)
   * GET /api/meals/planning/:date
   */
  async getMealPlanningReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const date = new Date(String(req.params.date));

      const report = await mealCancellationService.getMealPlanningReport(date);

      sendSuccess(res, report);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Bulk cancel meals (Admin)
   * POST /api/meals/bulk-cancel
   */
  async bulkCancelMeals(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await mealCancellationService.bulkCancelMeals(
        req.body.studentIds,
        req.body.dates,
        req.body.mealTypes,
        req.body.reason,
      );

      sendSuccess(res, result, 'Bulk cancellation completed');
    } catch (error) {
      next(error);
    }
  }
}

export default new MealCancellationController();
