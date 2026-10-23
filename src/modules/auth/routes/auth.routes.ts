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
import { authRateLimiter } from '@/shared/middleware/rateLimit.middleware';

const router = Router();

/**
 * @route   POST /api/auth/login
 * @desc    Login with university ID and password
 * @access  Public
 */
router.post('/login', authRateLimiter, validate(loginSchema), authController.login);

/**
 * @route   POST /api/auth/first-time-login
 * @desc    First-time login with OTP
 * @access  Public
 */
router.post(
  '/first-time-login',
  authRateLimiter,
  validate(firstTimeLoginSchema),
  authController.firstTimeLogin,
);

/**
 * @route   POST /api/auth/refresh-token
 * @desc    Refresh access token using refresh token cookie
 * @access  Public (uses cookie, no Bearer token needed)
 */
router.post('/refresh-token', authController.refreshToken);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Request password reset OTP
 * @access  Public
 */
router.post(
  '/forgot-password',
  authRateLimiter,
  validate(forgotPasswordSchema),
  authController.forgotPassword,
);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password with OTP
 * @access  Public
 */
router.post(
  '/reset-password',
  authRateLimiter,
  validate(resetPasswordSchema),
  authController.resetPassword,
);

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
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private (All authenticated users)
 */
// No access token needed: an expired one must not leave the refresh cookie alive
router.post('/logout', authController.logout);

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
