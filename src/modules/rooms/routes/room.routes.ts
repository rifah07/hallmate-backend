import { Router } from 'express';
import roomController from '../controllers/room.controller';
import { validate } from '@/shared/middleware/validate';
import { authenticate } from '@/shared/middleware/authenticate';
import { authorize } from '@/shared/middleware/authorize';
import { getVacantRoomsByFloorValidation } from '../validations/room.validation';

const router = Router();

router.use(authenticate);

router.get(
  '/statistics',
  authorize('SUPER_ADMIN', 'PROVOST', 'HOUSE_TUTOR'),
  roomController.getStatistics,
);

router.get(
  '/vacant',
  authorize('SUPER_ADMIN', 'PROVOST', 'HOUSE_TUTOR'),
  roomController.getVacantRooms,
);

router.get(
  '/vacant/floor/:floor',
  authorize('SUPER_ADMIN', 'PROVOST', 'HOUSE_TUTOR'),
  validate(getVacantRoomsByFloorValidation),
  roomController.getVacantRoomsByFloor,
);

// ============================================================================
// MY FLOOR (House Tutor only)
// ============================================================================

router.get('/my-floor', authorize('HOUSE_TUTOR'), roomController.getMyFloorRooms);

export default router;
