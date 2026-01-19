import { Router } from 'express';
import authController from '../controllers/auth.controller';
import { validate } from '@/shared/middleware/validate';
import { loginSchema, firstTimeLoginSchema } from '../schemas/auth.schema';

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

export default router;