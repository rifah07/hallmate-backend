import { hashPassword, comparePassword } from '@/shared/utils/crypto/password.util';
import { generateAccessToken, generateRefreshToken } from '@/shared/utils/crypto/jwt.util';
import { AppError } from '@/shared/middleware/errorHandler';
import {
  LoginInput,
  FirstTimeLoginInput,
  ChangePasswordInput,
  ResetPasswordInput,
  ForgotPasswordInput,
} from '../schemas/auth.schema';
import emailService from '@/shared/utils/email/email.service';
import authRepository from '../repositories/auth.repository';

class AuthService {
  async login(data: LoginInput) {
    const { universityId, password } = data;

    // Find user with password field
    const user = await authRepository.findByUniversityId(universityId);

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
    const user = await authRepository.findByUniversityId(universityId);

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
    const updatedUser = await authRepository.completeFirstLogin(user.id, hashedPassword);

    // Generate tokens
    const payload = {
      userId: updatedUser.id,
      universityId: updatedUser.universityId,
      role: updatedUser.role,
      accountStatus: updatedUser.accountStatus,
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    const { password: _, oneTimePassword: __, ...userWithoutPassword } = updatedUser;

    return {
      user: userWithoutPassword,
      accessToken,
      refreshToken,
    };
  }

  /**
   * Forgot Password - Generate and send OTP
   */
  async forgotPassword(data: ForgotPasswordInput) {
    const { universityId } = data;

    // Find user
    const user = await authRepository.findByUniversityId(universityId);

    // Don't reveal if user exists or not (security)
    if (!user) {
      return {
        message: 'If this account exists, an OTP has been sent to your email',
      };
    }

    // Check account status
    if (user.accountStatus === 'SUSPENDED' || user.accountStatus === 'SEAT_CANCELLED') {
      throw new AppError('Your account is not active. Contact hall office.', 403);
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Hash OTP
    const hashedOTP = await hashPassword(otp);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    // Store OTP with 15-minute expiry
    await authRepository.setPasswordResetToken(user.id, hashedOTP, expiresAt);

    // Send OTP via email
    await emailService.sendPasswordResetOTP(user.email, user.name, otp);

    return {
      message: 'If this account exists, an OTP has been sent to your email',
    };
  }

  /**
   * Reset Password - Verify OTP and set new password
   */
  async resetPassword(data: ResetPasswordInput) {
    const { universityId, otp, newPassword } = data;

    // Find user
    const user = await authRepository.findByUniversityId(universityId);

    if (!user || !user.passwordResetToken || !user.passwordResetExpires) {
      throw new AppError('Invalid or expired OTP', 400);
    }

    if (new Date() > user.passwordResetExpires) {
      throw new AppError('OTP has expired. Please request a new one.', 400);
    }

    // Verify OTP
    const isOTPValid = await comparePassword(otp, user.passwordResetToken);
    if (!isOTPValid) {
      throw new AppError('Invalid OTP', 400);
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password and clear reset token
    await authRepository.updatePassword(user.id, hashedPassword);
    await authRepository.clearPasswordResetToken(user.id);

    // Send confirmation email
    await emailService.sendPasswordChangedConfirmation(user.email, user.name);

    return {
      message: 'Password reset successfully',
    };
  }

  /**
   * Change Password - For logged-in users
   */
  async changePassword(userId: string, data: ChangePasswordInput) {
    const { oldPassword, newPassword } = data;

    // Get user with password
    const user = await authRepository.findById(userId);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Verify old password
    const isOldPasswordValid = await comparePassword(oldPassword, user.password);
    if (!isOldPasswordValid) {
      throw new AppError('Current password is incorrect', 400);
    }

    // Check if new password is same as old
    const isSamePassword = await comparePassword(newPassword, user.password);
    if (isSamePassword) {
      throw new AppError('New password cannot be the same as current password', 400);
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password
    await authRepository.updatePassword(user.id, hashedPassword);

    // Send confirmation email
    await emailService.sendPasswordChangedConfirmation(user.email, user.name);

    return {
      message: 'Password changed successfully',
    };
  }
}

export default new AuthService();
