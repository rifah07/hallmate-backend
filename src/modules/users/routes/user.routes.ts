import { Router } from 'express';
import userController from '../controllers/user.controller';
import { validate } from '@/shared/middleware/validate';
import { authenticate } from '@/shared/middleware/authenticate';
import { authorize } from '@/shared/middleware/authorize';
import {
  getUserByIdValidation,
  getUserByUniversityIdValidation,
  getAllUsersValidation,
  createUserValidation,
  updateUserValidation,
  updateUserRoleValidation,
  updateAccountStatusValidation,
  deleteUserValidation,
  restoreUserValidation,
  getUsersByRoleValidation,
  getUsersByFloorValidation,
  bulkCreateUsersValidation,
  uploadProfilePictureValidation,
  deleteProfilePictureValidation,
} from '../validations/user.validation';
import { handleMulterError, upload } from '@/shared/middleware/upload.middleware';

const router = Router();

// All user routes require authentication
router.use(authenticate);

// ============================================================================
// TEMPLATE & BULK UPLOAD (must be before other routes to avoid conflicts)
// ============================================================================

/**
 * @route   GET /api/users/template/download
 * @desc    Download Excel template for bulk user upload
 * @access  Admin, Provost
 */
router.get(
  '/template/download',
  authorize('SUPER_ADMIN', 'PROVOST'),
  userController.downloadUserTemplate,
);

/**
 * @route   POST /api/users/bulk-upload
 * @desc    Upload Excel/CSV file to bulk create users
 * @access  Admin, Provost
 */
router.post(
  '/bulk-upload',
  authorize('SUPER_ADMIN', 'PROVOST'),
  upload.single('file'),
  handleMulterError,
  userController.bulkUploadUsers,
);

// ============================================================================
// ADMIN ROUTES (statistics, bulk JSON operations)
// ============================================================================

/**
 * @route   GET /api/users/statistics
 * @desc    Get user statistics
 * @access  Admin, Provost, House Tutor
 */
router.get('/statistics', authorize('SUPER_ADMIN', 'PROVOST'), userController.getUserStatistics);

/**
 * @route   POST /api/users/bulk
 * @desc    Bulk create users from JSON
 * @access  Super Admin
 */
router.post(
  '/bulk',
  authorize('SUPER_ADMIN'),
  validate(bulkCreateUsersValidation),
  userController.bulkCreateUsers,
);

// ============================================================================
// COLLECTION ROUTES
// ============================================================================

/**
 * @route   GET /api/users
 * @desc    Get all users with filters and pagination
 * @access  Admin, Provost, House Tutor, Office Staff
 */
router.get(
  '/',
  authorize('SUPER_ADMIN', 'PROVOST', 'HOUSE_TUTOR', 'OFFICE_STAFF'),
  validate(getAllUsersValidation),
  userController.getAllUsers,
);

/**
 * @route   POST /api/users
 * @desc    Create new user
 * @access  Admin, Provost
 */
router.post(
  '/',
  authorize('SUPER_ADMIN', 'PROVOST'),
  validate(createUserValidation),
  userController.createUser,
);

// ============================================================================
// SEARCH & FILTER ROUTES (before /:userId to avoid conflicts)
// ============================================================================

/**
 * @route   GET /api/users/search
 * @desc    Search users by name, email, or universityId
 * @access  Authenticated
 */
router.get('/search', userController.searchUsers);

/**
 * @route   GET /api/users/role/:role
 * @desc    Get users by role
 * @access  Admin, Provost, House Tutor
 */
router.get(
  '/role/:role',
  authorize('SUPER_ADMIN', 'PROVOST', 'HOUSE_TUTOR'),
  validate(getUsersByRoleValidation),
  userController.getUsersByRole,
);

/**
 * @route   GET /api/users/floor/:floor
 * @desc    Get users by floor
 * @access  Admin, Provost, House Tutor
 */
router.get(
  '/floor/:floor',
  authorize('SUPER_ADMIN', 'PROVOST', 'HOUSE_TUTOR'),
  validate(getUsersByFloorValidation),
  userController.getUsersByFloor,
);

/**
 * @route   GET /api/users/university/:universityId
 * @desc    Get user by university ID
 * @access  Admin, Provost, House Tutor, Office Staff
 */
router.get(
  '/university/:universityId',
  authorize('SUPER_ADMIN', 'PROVOST', 'HOUSE_TUTOR', 'OFFICE_STAFF'),
  validate(getUserByUniversityIdValidation),
  userController.getUserByUniversityId,
);

// ============================================================================
// SINGLE USER ROUTES
// ============================================================================

/**
 * @route   GET /api/users/:userId
 * @desc    Get user by ID
 * @access  Admin, Provost, House Tutor, Office Staff
 */
router.get(
  '/:userId',
  authorize('SUPER_ADMIN', 'PROVOST', 'HOUSE_TUTOR', 'OFFICE_STAFF'),
  validate(getUserByIdValidation),
  userController.getUserById,
);

/**
 * @route   PATCH /api/users/:userId
 * @desc    Update user (admins can update any field, users can only update own limited fields)
 * @access  Authenticated (self or admin)
 */
router.patch('/:userId', validate(updateUserValidation), userController.updateUser);

/**
 * @route   DELETE /api/users/:userId
 * @desc    Soft delete user
 * @access  Admin, Provost
 */
router.delete(
  '/:userId',
  authorize('SUPER_ADMIN', 'PROVOST'),
  validate(deleteUserValidation),
  userController.deleteUser,
);

/**
 * @route   PATCH /api/users/:userId/role
 * @desc    Update user role
 * @access  Super Admin only
 */
router.patch(
  '/:userId/role',
  authorize('SUPER_ADMIN'),
  validate(updateUserRoleValidation),
  userController.updateUserRole,
);

/**
 * @route   PATCH /api/users/:userId/status
 * @desc    Update account status
 * @access  Admin, Provost
 */
router.patch(
  '/:userId/status',
  authorize('SUPER_ADMIN', 'PROVOST'),
  validate(updateAccountStatusValidation),
  userController.updateAccountStatus,
);

/**
 * @route   POST /api/users/:userId/restore
 * @desc    Restore soft-deleted user
 * @access  Super Admin only
 */
router.post(
  '/:userId/restore',
  authorize('SUPER_ADMIN'),
  validate(restoreUserValidation),
  userController.restoreUser,
);

// ============================================================================
// PROFILE PICTURE ROUTES
// ============================================================================

/**
 * @route   POST /api/users/:userId/profile-picture
 * @desc    Upload profile picture
 * @access  Authenticated (self or admin)
 */
router.post(
  '/:userId/profile-picture',
  upload.single('file'),
  handleMulterError,
  validate(uploadProfilePictureValidation),
  userController.uploadProfilePicture,
);

/**
 * @route   DELETE /api/users/:userId/profile-picture
 * @desc    Delete profile picture
 * @access  Authenticated (self or admin)
 */
router.delete(
  '/:userId/profile-picture',
  validate(deleteProfilePictureValidation),
  userController.deleteProfilePicture,
);

/**
 * @route   GET /api/users/:userId/profile-picture/optimized
 * @desc    Get optimized profile picture
 * @access  Authenticated (self or admin)
 */
router.get(
  '/:userId/profile-picture/optimized',
  validate(getUserByIdValidation),
  userController.getOptimizedProfilePicture,
);

export default router;
