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
// ADMIN ROUTES (statistics, bulk operations)
// ============================================================================

router.get('/statistics', authorize('SUPER_ADMIN', 'PROVOST'), userController.getUserStatistics);

router.post(
  '/bulk',
  authorize('SUPER_ADMIN'),
  validate(bulkCreateUsersValidation),
  userController.bulkCreateUsers,
);

// ============================================================================
// COLLECTION ROUTES
// ============================================================================

router
  .route('/')
  .get(
    authorize('SUPER_ADMIN', 'PROVOST', 'HOUSE_TUTOR', 'OFFICE_STAFF'),
    validate(getAllUsersValidation),
    userController.getAllUsers,
  )
  .post(
    authorize('SUPER_ADMIN', 'PROVOST'),
    validate(createUserValidation),
    userController.createUser,
  );

// ============================================================================
// ROLE AND FLOOR ROUTES (before /:userId to avoid conflicts)
// ============================================================================

router.get(
  '/role/:role',
  authorize('SUPER_ADMIN', 'PROVOST', 'HOUSE_TUTOR'),
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
  authorize('SUPER_ADMIN', 'PROVOST', 'HOUSE_TUTOR', 'OFFICE_STAFF'),
  validate(getUserByUniversityIdValidation),
  userController.getUserByUniversityId,
);

// ============================================================================
// SINGLE USER ROUTES
// ============================================================================

router
  .route('/:userId')
  .get(
    authorize('SUPER_ADMIN', 'PROVOST', 'HOUSE_TUTOR', 'OFFICE_STAFF'),
    validate(getUserByIdValidation),
    userController.getUserById,
  )
  .patch(validate(updateUserValidation), userController.updateUser)
  .delete(
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
  authorize('SUPER_ADMIN', 'PROVOST'),
  upload.single('file'),
  handleMulterError,
  validate(uploadProfilePictureValidation),
  userController.uploadProfilePicture,
);

router.delete(
  '/:userId/profile-picture',
  authorize('SUPER_ADMIN', 'PROVOST'),
  validate(deleteProfilePictureValidation),
  userController.deleteProfilePicture,
);

router.get(
  '/:userId/profile-picture/optimized',
  validate(getUserByIdValidation),
  userController.getOptimizedProfilePicture,
);

export default router;
