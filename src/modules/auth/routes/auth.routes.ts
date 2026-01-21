import { Router } from 'express';
import authController from '../controllers/auth.controller';
import { validate } from '@/shared/middleware/validate';
import { loginSchema, firstTimeLoginSchema } from '../schemas/auth.schema';
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
