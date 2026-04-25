import { Router } from 'express';
import mealController from '../controllers/meal.controller';
import { authenticate } from '@/shared/middleware/authenticate';
import { authorize } from '@/shared/middleware/authorize';
import { validate } from '@/shared/middleware/validate';
import {
  updateMealSchema,
  bulkUpdateMealSchema,
  mealQuerySchema,
  mealDateSchema,
  studentIdSchema,
  monthYearSchema,
} from '../validations/meal.validation';

const router = Router();

router.use(authenticate);

// ============================================================================
// SPECIAL ROUTES (must come before parameterized routes)
// ============================================================================

// POST /api/meals/bulk - Bulk update meal logs (dining staff, admin)
router.post(
  '/bulk',
  authorize('SUPER_ADMIN', 'PROVOST', 'DINING_STAFF'),
  validate(bulkUpdateMealSchema, 'body'),
  mealController.bulkUpdateMealLogs,
);

// GET /api/meals/my-logs - Get my meal history (student only)
router.get('/my-logs', authorize('STUDENT'), mealController.getMyMealLogs);

// GET /api/meals/statistics/:date - Get statistics for a date
router.get(
  '/statistics/:date',
  authorize('SUPER_ADMIN', 'PROVOST', 'DINING_STAFF', 'HOUSE_TUTOR', 'OFFICE_STAFF'),
  validate(mealDateSchema, 'params'),
  mealController.getStatisticsByDate,
);

// ============================================================================
// COLLECTION ROUTES
// ============================================================================

// GET /api/meals - List all meal logs
router.get(
  '/',
  authorize('SUPER_ADMIN', 'PROVOST', 'DINING_STAFF', 'HOUSE_TUTOR', 'OFFICE_STAFF', 'STUDENT'),
  validate(mealQuerySchema, 'query'),
  mealController.getAllMealLogs,
);

// ============================================================================
// STUDENT-SPECIFIC ROUTES
// ============================================================================

// GET /api/meals/:studentId/:month/:year - Get monthly summary
router.get(
  '/:studentId/:month/:year',
  authorize('SUPER_ADMIN', 'PROVOST', 'DINING_STAFF', 'OFFICE_STAFF', 'STUDENT'),
  validate(studentIdSchema, 'params'),
  validate(monthYearSchema, 'params'),
  mealController.getMonthlyMealSummary,
);

// GET /api/meals/:studentId/:date - Get meal log by date
router.get(
  '/:studentId/:date',
  authorize('SUPER_ADMIN', 'PROVOST', 'DINING_STAFF', 'HOUSE_TUTOR', 'OFFICE_STAFF', 'STUDENT'),
  validate(studentIdSchema, 'params'),
  validate(mealDateSchema, 'params'),
  mealController.getMealLogByDate,
);

// PUT /api/meals/:studentId/:date - Update meal log
router.put(
  '/:studentId/:date',
  authorize('SUPER_ADMIN', 'PROVOST', 'DINING_STAFF', 'HOUSE_TUTOR', 'STUDENT'),
  validate(studentIdSchema, 'params'),
  validate(mealDateSchema, 'params'),
  validate(updateMealSchema, 'body'),
  mealController.updateMealLog,
);

// DELETE /api/meals/:studentId/:date - Delete meal log
router.delete(
  '/:studentId/:date',
  authorize('SUPER_ADMIN', 'PROVOST', 'DINING_STAFF'),
  validate(studentIdSchema, 'params'),
  validate(mealDateSchema, 'params'),
  mealController.deleteMealLog,
);

export default router;
