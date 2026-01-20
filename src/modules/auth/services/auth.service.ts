import prisma from '@/config/database.config';
import { hashPassword, comparePassword } from '@/shared/utils/crypto/password.util';
import { generateAccessToken, generateRefreshToken } from '@/shared/utils/crypto/jwt.util';
import { AppError } from '@/shared/middleware/errorHandler';
import { LoginInput, FirstTimeLoginInput } from '../schemas/auth.schema';

class AuthService {
  async login(data: LoginInput) {
    const { universityId, password } = data;

    // Find user with password field
    const user = await prisma.user.findUnique({
      where: { universityId },
      select: {
        id: true,
        universityId: true,
        name: true,
        email: true,
        role: true,
        accountStatus: true,
        password: true,
        isFirstLogin: true,
        photo: true,
      },
    });

    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    // Check account status
    if (user.accountStatus === 'SEAT_CANCELLED') {
      throw new AppError('Your seat has been cancelled. Contact hall office.', 403);
    }

    if (user.accountStatus === 'SUSPENDED') {
      throw new AppError('Your account has been suspended. Contact hall office.', 403);
    }

    // Check if first login
    if (user.isFirstLogin) {
      throw new AppError('First-time login required. Please use your one-time password.', 403);
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      // TODO: Implement failed login attempt tracking
      throw new AppError('Invalid credentials', 401);
    }

    // Generate tokens
    const payload = {
      userId: user.id,
      universityId: user.universityId,
      role: user.role,
      accountStatus: user.accountStatus,
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      accessToken,
      refreshToken,
    };
  }

  async firstTimeLogin(data: FirstTimeLoginInput) {
    const { universityId, oneTimePassword, newPassword } = data;

    // Find user
    const user = await prisma.user.findUnique({
      where: { universityId },
      select: {
        id: true,
        universityId: true,
        name: true,
        email: true,
        role: true,
        accountStatus: true,
        isFirstLogin: true,
        oneTimePassword: true,
        otpExpiresAt: true,
      },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Check if already completed first login
    if (!user.isFirstLogin) {
      throw new AppError('First-time login already completed. Use regular login.', 400);
    }

    // Check if OTP exists
    if (!user.oneTimePassword) {
      throw new AppError('No OTP found. Contact administrator.', 400);
    }

    // Check if OTP expired
    if (user.otpExpiresAt && new Date() > user.otpExpiresAt) {
      throw new AppError('OTP has expired. Contact administrator for password reset.', 400);
    }

    // Verify OTP
    const isOTPValid = await comparePassword(oneTimePassword, user.oneTimePassword);
    if (!isOTPValid) {
      throw new AppError('Invalid OTP', 401);
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        isFirstLogin: false,
        oneTimePassword: null,
        otpExpiresAt: null,
        passwordChangedAt: new Date(),
      },
      select: {
        id: true,
        universityId: true,
        name: true,
        email: true,
        role: true,
        accountStatus: true,
        photo: true,
      },
    });

    // Generate tokens
    const payload = {
      userId: updatedUser.id,
      universityId: updatedUser.universityId,
      role: updatedUser.role,
      accountStatus: updatedUser.accountStatus,
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    return {
      user: updatedUser,
      accessToken,
      refreshToken,
    };
  }
}

export default new AuthService();
