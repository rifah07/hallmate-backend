/**
 * ENHANCED MEAL ROUTES - Default-ON System
 *
 * New Endpoints:
 * - POST /cancel - Student cancels meals
 * - POST /reactivate - Student reactivates cancelled meals
 * - GET /my-status - Student sees meal calendar status
 * - GET /planning/:date - Staff sees planning report
 * - POST /bulk-cancel - Admin cancels for multiple students
 */

import { Router } from 'express';
import mealCancellationController from '../controllers/meal-cancellation.controller';
import { authenticate } from '@/shared/middleware/authenticate';
import { authorize } from '@/shared/middleware/authorize';
import { validate } from '@/shared/middleware/validate';
import { z } from 'zod';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ============================================================================
// MEAL CANCELLATION ENDPOINTS (NEW!)
// ============================================================================

/**
 * POST /api/meals/cancel
 * Student cancels meals from calendar
 *
 * Body: {
 *   dates: ["2026-04-25", "2026-04-26", "2026-04-27"],
 *   mealTypes: ["breakfast", "lunch"],
 *   reason: "Going home for weekend"
 * }
 */
router.post(
  '/cancel',
  authorize('STUDENT'),
  validate(
    z.object({
      dates: z
        .array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/))
        .min(1)
        .max(30),
      mealTypes: z.array(z.enum(['breakfast', 'lunch', 'dinner'])).min(1),
      reason: z.string().max(200).optional(),
    }),
    'body',
  ),
  mealCancellationController.cancelMeals,
);

/**
 * POST /api/meals/reactivate
 * Student reactivates previously cancelled meals
 *
 * Body: {
 *   dates: ["2026-04-25"],
 *   mealTypes: ["breakfast"]
 * }
 */
router.post(
  '/reactivate',
  authorize('STUDENT'),
  validate(
    z.object({
      dates: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).min(1),
      mealTypes: z.array(z.enum(['breakfast', 'lunch', 'dinner'])).min(1),
    }),
    'body',
  ),
  mealCancellationController.reactivateMeals,
);

/**
 * GET /api/meals/my-status?dateFrom=2026-04-20&dateTo=2026-04-30
 * Get meal calendar status for student
 * Shows which meals are active vs cancelled
 */
router.get('/my-status', authorize('STUDENT'), mealCancellationController.getMyMealStatus);

/**
 * GET /api/meals/planning/:date
 * Kitchen planning report
 * Shows how many students will eat each meal
 */
router.get(
  '/planning/:date',
  authorize('SUPER_ADMIN', 'PROVOST', 'DINING_STAFF'),
  validate(
    z.object({
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    }),
    'params',
  ),
  mealCancellationController.getMealPlanningReport,
);

/**
 * POST /api/meals/bulk-cancel
 * Admin cancels meals for multiple students
 * Use case: Hall closed, holiday, etc.
 */
router.post(
  '/bulk-cancel',
  authorize('SUPER_ADMIN', 'PROVOST', 'DINING_STAFF'),
  validate(
    z.object({
      studentIds: z.array(z.string().uuid()).min(1),
      dates: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).min(1),
      mealTypes: z.array(z.enum(['breakfast', 'lunch', 'dinner'])).min(1),
      reason: z.string().min(10),
    }),
    'body',
  ),
  mealCancellationController.bulkCancelMeals,
);

export default router;
