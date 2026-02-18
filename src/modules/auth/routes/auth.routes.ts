import { Router } from 'express';
import authController from '../controllers/auth.controller';
import { validate } from '@/shared/middleware/validate';
import {
  loginSchema,
  firstTimeLoginSchema,
  changePasswordSchema,
  resetPasswordSchema,
  forgotPasswordSchema,
} from '../validations/auth.validation';
import { authenticate } from '@/shared/middleware/authenticate';
import profileController from '../controllers/profile.controller';
import { authorize } from '@/shared/middleware/authorize';

const router = Router();

/**
 * @route   POST /api/auth/login
 * @desc    Login with university ID and password
 * @access  Public
 */
router.post('/login', validate(loginSchema), authController.login);

/**
 * @route   POST /api/auth/first-time-login
 * @desc    First-time login with OTP
 * @access  Public
 */
router.post('/first-time-login', validate(firstTimeLoginSchema), authController.firstTimeLogin);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Public
 */
router.post('/logout', authController.logout);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Request password reset OTP
 * @access  Public
 */
router.post('/forgot-password', validate(forgotPasswordSchema), authController.forgotPassword);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password with OTP
 * @access  Public
 */
router.post('/reset-password', validate(resetPasswordSchema), authController.resetPassword);

/**
 * @route   POST /api/auth/change-password
 * @desc    Change password (logged-in user)
 * @access  Private (All authenticated users)
 */
router.post(
  '/change-password',
  authenticate,
  validate(changePasswordSchema),
  authController.changePassword,
);

// ============================================================================
// PROTECTED ROUTES (Authentication required)
// ============================================================================

/**
 * @route   GET /api/auth/profile
 * @desc    Get current user profile
 * @access  Private (All authenticated users)
 */
router.get('/profile', authenticate, profileController.getProfile);

/**
 * @route GET /api/auth/users/:id
 * @desc GET users by Id
 * @access Private (Super Admin, Provost only)
 */
router.get(
  '/users/:universityId',
  authenticate,
  authorize('SUPER_ADMIN', 'PROVOST'),
  profileController.getUserByUniversityId,
);

export default router;
