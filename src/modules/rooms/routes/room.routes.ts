import { Router } from 'express';
import roomController from '../controllers/room.controller';
import { validate } from '@/shared/middleware/validate';
import { authenticate } from '@/shared/middleware/authenticate';
import { authorize } from '@/shared/middleware/authorize';
import {
  createRoomValidation,
  updateRoomValidation,
  getRoomByIdValidation,
  deleteRoomValidation,
  getRoomsByFloorValidation,
  getRoomsByTypeValidation,
  getVacantRoomsByFloorValidation,
  getAllRoomsValidation,
  assignStudentValidation,
  unassignStudentValidation,
  transferStudentValidation,
} from '../validations/room.validation';

const router = Router();

// All room routes require authentication
router.use(authenticate);

// ============================================================================
// STATISTICS (MUST be before /:roomId)
// ============================================================================

/**
 * @route GET /statistics
 * @desc Retrieve aggregated statistics for all rooms.
 * @access SUPER_ADMIN, PROVOST, HOUSE_TUTOR
 */
router.get(
  '/statistics',
  authorize('SUPER_ADMIN', 'PROVOST', 'HOUSE_TUTOR'),
  roomController.getStatistics,
);

// ============================================================================
// VACANCY ROUTES (MUST be before /:roomId)
// ============================================================================

/**
 * @route GET /vacant
 * @desc Retrieve a list of all currently vacant rooms.
 * @access SUPER_ADMIN, PROVOST, HOUSE_TUTOR
 */
router.get(
  '/vacant',
  authorize('SUPER_ADMIN', 'PROVOST', 'HOUSE_TUTOR'),
  roomController.getVacantRooms,
);

/**
 * @route GET /vacant/floor/:floor
 * @desc Retrieve vacant rooms on a specific floor.
 * @access SUPER_ADMIN, PROVOST, HOUSE_TUTOR
 */
router.get(
  '/vacant/floor/:floor',
  authorize('SUPER_ADMIN', 'PROVOST', 'HOUSE_TUTOR'),
  validate(getVacantRoomsByFloorValidation),
  roomController.getVacantRoomsByFloor,
);

// ============================================================================
// MY FLOOR (House Tutor only)
// ============================================================================

/**
 * @route GET /my-floor
 * @desc Retrieve rooms on the authenticated house tutor's floor.
 * @access HOUSE_TUTOR
 */
router.get('/my-floor', authorize('HOUSE_TUTOR'), roomController.getMyFloorRooms);

// ============================================================================
// FILTER ROUTES (MUST be before /:roomId)
// ============================================================================

/**
 * @route GET /floor/:floor
 * @desc Retrieve all rooms on a specified floor.
 * @access SUPER_ADMIN, PROVOST, HOUSE_TUTOR
 */
router.get(
  '/floor/:floor',
  authorize('SUPER_ADMIN', 'PROVOST', 'HOUSE_TUTOR'),
  validate(getRoomsByFloorValidation),
  roomController.getRoomsByFloor,
);

/**
 * @route GET /type/:type
 * @desc Retrieve all rooms of a specified type (e.g., single, double).
 * @access SUPER_ADMIN, PROVOST, HOUSE_TUTOR
 */
router.get(
  '/type/:type',
  authorize('SUPER_ADMIN', 'PROVOST', 'HOUSE_TUTOR'),
  validate(getRoomsByTypeValidation),
  roomController.getRoomsByType,
);

// ============================================================================
// COLLECTION ROUTES
// ============================================================================

/**
 * @route GET /
 * @desc Retrieve a list of all rooms.
 * @access SUPER_ADMIN, PROVOST, HOUSE_TUTOR, OFFICE_STAFF
 */
router.get(
  '/',
  authorize('SUPER_ADMIN', 'PROVOST', 'HOUSE_TUTOR', 'OFFICE_STAFF'),
  validate(getAllRoomsValidation),
  roomController.getAllRooms,
);

/**
 * @route POST /
 * @desc Create a new room.
 * @access SUPER_ADMIN, PROVOST
 */
router.post(
  '/',
  authorize('SUPER_ADMIN', 'PROVOST'),
  validate(createRoomValidation),
  roomController.createRoom,
);

// ============================================================================
// SINGLE ROOM ROUTES
// ============================================================================

/**
 * @route GET /:roomId
 * @desc Retrieve details of a specific room by ID.
 * @access SUPER_ADMIN, PROVOST, HOUSE_TUTOR, OFFICE_STAFF
 */
router.get(
  '/:roomId',
  authorize('SUPER_ADMIN', 'PROVOST', 'HOUSE_TUTOR', 'OFFICE_STAFF'),
  validate(getRoomByIdValidation),
  roomController.getRoomById,
);

/**
 * @route PATCH /:roomId
 * @desc Update details of a specific room.
 * @access SUPER_ADMIN, PROVOST
 */
router.patch(
  '/:roomId',
  authorize('SUPER_ADMIN', 'PROVOST'),
  validate(updateRoomValidation),
  roomController.updateRoom,
);

/**
 * @route DELETE /:roomId
 * @desc Delete a specific room.
 * @access SUPER_ADMIN, PROVOST
 */
router.delete(
  '/:roomId',
  authorize('SUPER_ADMIN', 'PROVOST'),
  validate(deleteRoomValidation),
  roomController.deleteRoom,
);

// ============================================================================
// ASSIGNMENT ROUTES
// ============================================================================

/**
 * @route POST /:roomId/assign
 * @desc Assign a student to a room.
 * @access SUPER_ADMIN, PROVOST, HOUSE_TUTOR
 */
router.post(
  '/:roomId/assign',
  authorize('SUPER_ADMIN', 'PROVOST', 'HOUSE_TUTOR'),
  validate(assignStudentValidation),
  roomController.assignStudent,
);

/**
 * @route DELETE /:roomId/unassign/:userId
 * @desc Remove a student (by user ID) from a room.
 * @access SUPER_ADMIN, PROVOST, HOUSE_TUTOR
 */
router.delete(
  '/:roomId/unassign/:userId',
  authorize('SUPER_ADMIN', 'PROVOST', 'HOUSE_TUTOR'),
  validate(unassignStudentValidation),
  roomController.unassignStudent,
);

/**
 * @route POST /:roomId/transfer
 * @desc Transfer a student to another room.
 * @access SUPER_ADMIN, PROVOST, HOUSE_TUTOR
 */
router.post(
  '/:roomId/transfer',
  authorize('SUPER_ADMIN', 'PROVOST', 'HOUSE_TUTOR'),
  validate(transferStudentValidation),
  roomController.transferStudent,
);

export default router;
