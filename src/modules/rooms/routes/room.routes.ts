import { Router } from 'express';
import roomController from '../controllers/room.controller';
import { validate } from '@/shared/middleware/validate';
import { authenticate } from '@/shared/middleware/authenticate';
import { authorize } from '@/shared/middleware/authorize';
import {
  createRoomValidation,
  getRoomsByFloorValidation,
  getRoomsByTypeValidation,
  getVacantRoomsByFloorValidation,
  getAllRoomsValidation,
} from '../validations/room.validation';

const router = Router();

// All room routes require authentication
router.use(authenticate);

// ============================================================================
// STATISTICS (MUST be before /:roomId)
// ============================================================================

router.get(
  '/statistics',
  authorize('SUPER_ADMIN', 'PROVOST', 'HOUSE_TUTOR'),
  roomController.getStatistics,
);

// ============================================================================
// VACANCY ROUTES (MUST be before /:roomId)
// ============================================================================

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

// ============================================================================
// FILTER ROUTES (MUST be before /:roomId)
// ============================================================================

router.get(
  '/floor/:floor',
  authorize('SUPER_ADMIN', 'PROVOST', 'HOUSE_TUTOR'),
  validate(getRoomsByFloorValidation),
  roomController.getRoomsByFloor,
);

router.get(
  '/type/:type',
  authorize('SUPER_ADMIN', 'PROVOST', 'HOUSE_TUTOR'),
  validate(getRoomsByTypeValidation),
  roomController.getRoomsByType,
);

// ============================================================================
// COLLECTION ROUTES
// ============================================================================

router.get(
  '/',
  authorize('SUPER_ADMIN', 'PROVOST', 'HOUSE_TUTOR', 'OFFICE_STAFF'),
  validate(getAllRoomsValidation),
  roomController.getAllRooms,
);

router.post(
  '/',
  authorize('SUPER_ADMIN', 'PROVOST'),
  validate(createRoomValidation),
  roomController.createRoom,
);

export default router;
