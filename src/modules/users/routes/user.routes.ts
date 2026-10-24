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
  searchUsersValidation,
} from '../validations/user.validation';
import {
  uploadImage,
  uploadDocument,
  handleMulterError,
} from '@/shared/middleware/upload.middleware';

const router = Router();

// All user routes require authentication
router.use(authenticate);

// ============================================================================
// TEMPLATE & BULK UPLOAD (MUST be before /:userId routes)
// ============================================================================

router.get(
  '/template/download',
  authorize('SUPER_ADMIN', 'PROVOST'),
  userController.downloadUserTemplate,
);

router.post(
  '/bulk-upload',
  authorize('SUPER_ADMIN', 'PROVOST'),
  uploadDocument.single('file'), // ← Use uploadDocument instead of upload
  handleMulterError,
  userController.bulkUploadUsers,
);

// ============================================================================
// STATISTICS & BULK JSON
// ============================================================================

router.get(
  '/statistics',
  authorize('SUPER_ADMIN', 'PROVOST', 'HOUSE_TUTOR'),
  userController.getUserStatistics,
);

router.post(
  '/bulk',
  authorize('SUPER_ADMIN', 'PROVOST'),
  validate(bulkCreateUsersValidation),
  userController.bulkCreateUsers,
);

// ============================================================================
// SEARCH & FILTER ROUTES (before /:userId)
// ============================================================================

// Staff only: results include phone numbers and room numbers of residents
router.get(
  '/search',
  authorize('SUPER_ADMIN', 'PROVOST', 'HOUSE_TUTOR'),
  validate(searchUsersValidation),
  userController.searchUsers,
);

router.get(
  '/role/:role',
  authorize('SUPER_ADMIN', 'PROVOST'),
  validate(getUsersByRoleValidation),
  userController.getUsersByRole,
);

router.get(
  '/floor/:floor',
  authorize('SUPER_ADMIN', 'PROVOST', 'HOUSE_TUTOR'),
  validate(getUsersByFloorValidation),
  userController.getUsersByFloor,
);

router.get(
  '/university/:universityId',
  authorize('SUPER_ADMIN', 'PROVOST', 'HOUSE_TUTOR'),
  validate(getUserByUniversityIdValidation),
  userController.getUserByUniversityId,
);

// ============================================================================
// COLLECTION ROUTES
// ============================================================================

router.get(
  '/',
  authorize('SUPER_ADMIN', 'PROVOST', 'HOUSE_TUTOR'),
  validate(getAllUsersValidation),
  userController.getAllUsers,
);

router.post(
  '/',
  authorize('SUPER_ADMIN', 'PROVOST'),
  validate(createUserValidation),
  userController.createUser,
);

// ============================================================================
// SINGLE USER ROUTES
// ============================================================================

router.get(
  '/:userId',
  authorize('SUPER_ADMIN', 'PROVOST', 'HOUSE_TUTOR'),
  validate(getUserByIdValidation),
  userController.getUserById,
);

router.patch('/:userId', validate(updateUserValidation), userController.updateUser);

router.delete(
  '/:userId',
  authorize('SUPER_ADMIN', 'PROVOST'),
  validate(deleteUserValidation),
  userController.deleteUser,
);

router.patch(
  '/:userId/role',
  authorize('SUPER_ADMIN'),
  validate(updateUserRoleValidation),
  userController.updateUserRole,
);

router.patch(
  '/:userId/status',
  authorize('SUPER_ADMIN', 'PROVOST'),
  validate(updateAccountStatusValidation),
  userController.updateAccountStatus,
);

router.post(
  '/:userId/reissue-otp',
  authorize('SUPER_ADMIN', 'PROVOST'),
  validate(getUserByIdValidation),
  userController.reissueOneTimePassword,
);

router.post(
  '/:userId/restore',
  authorize('SUPER_ADMIN'),
  validate(restoreUserValidation),
  userController.restoreUser,
);

// ============================================================================
// PROFILE PICTURE ROUTES
// ============================================================================

router.post(
  '/:userId/profile-picture',
  uploadImage.single('file'), // ← Use uploadImage for images
  handleMulterError,
  validate(uploadProfilePictureValidation),
  userController.uploadProfilePicture,
);

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
