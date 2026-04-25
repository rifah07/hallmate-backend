import { Router } from 'express';
import mealController from '../controllers/meal.controller';
import { authenticate } from '@/shared/middleware/authenticate';
import { authorize } from '@/shared/middleware/authorize';
import { validate } from '@/shared/middleware/validate';
import { bulkUpdateMealSchema, mealDateSchema } from '../validations/meal.validation';

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

export default router;
