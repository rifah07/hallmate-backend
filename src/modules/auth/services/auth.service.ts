import { createHash, randomInt } from 'crypto';
import { hashPassword, comparePassword } from '@/shared/utils/crypto/password.util';
import { generateAccessToken, generateRefreshToken } from '@/shared/utils/crypto/jwt.util';
import { AppError, ForbiddenError, UnauthorizedError } from 'shared/errors';
import {
  LoginInput,
  FirstTimeLoginInput,
  ChangePasswordInput,
  ResetPasswordInput,
  ForgotPasswordInput,
} from '../validations/auth.validation';
import emailService from '@/shared/utils/email/email.service';
import authRepository from '../repositories/auth.repository';

class AuthService {
  // Helper to hash refresh token before storing
  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
  async login(data: LoginInput) {
    const { universityId, password } = data;

    // Find user with password field
    const user = await authRepository.findByUniversityIdForAuth(universityId);

    if (!user || user.isDeleted) {
      throw new UnauthorizedError('Invalid credentials');
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

    // Save hashed refresh token to DB
    const hashedRefreshToken = this.hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await authRepository.saveRefreshToken(user.id, hashedRefreshToken, expiresAt);

    const {
      password: _,
      oneTimePassword: __,
      passwordResetToken: ___,
      ...userWithoutPassword
    } = user;

    return { user: userWithoutPassword, accessToken, refreshToken };
  }

  async firstTimeLogin(data: FirstTimeLoginInput) {
    const { universityId, oneTimePassword, newPassword } = data;

    // Find user
    const user = await authRepository.findByUniversityIdForAuth(universityId);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (!user.isFirstLogin) {
      throw new AppError('First-time login already completed. Use regular login.', 400);
    }

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

    // Save hashed refresh token to DB
    const hashedRefreshToken = this.hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await authRepository.saveRefreshToken(updatedUser.id, hashedRefreshToken, expiresAt);

    const {
      password: _,
      oneTimePassword: __,
      passwordResetToken: ___,
      ...userWithoutPassword
    } = updatedUser;

    return { user: userWithoutPassword, accessToken, refreshToken };
  }

   /**
   * RefreshToken - Rotate refresh token and issue new access token
   */
  async refreshToken(token: string) {
    if (!token) {
      throw new UnauthorizedError('Refresh token missing');
    }

    // Hash the incoming token to compare with DB
    const hashedToken = this.hashToken(token);
    const tokenRecord = await authRepository.findRefreshToken(hashedToken);

    if (!tokenRecord) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    if (tokenRecord.isRevoked) {
      // Token reuse detected — revoke all tokens for this user (security)
      await authRepository.revokeAllUserRefreshTokens(tokenRecord.userId);
      throw new UnauthorizedError('Refresh token reuse detected. Please log in again.');
    }

    if (new Date() > tokenRecord.expiresAt) {
      throw new UnauthorizedError('Refresh token expired. Please log in again.');
    }

    const user = tokenRecord.user;

    if (!user || user.isDeleted) {
      throw new UnauthorizedError('Account no longer exists');
    }

    if (['SUSPENDED', 'SEAT_CANCELLED', 'INACTIVE', 'GRADUATED'].includes(user.accountStatus)) {
      throw new ForbiddenError('Your account is not active. Please contact the hall office.');
    }

    // Revoke old token (rotation)
    await authRepository.revokeRefreshToken(tokenRecord.id);

    // Issue new tokens
    const payload = {
      userId: user.id,
      universityId: user.universityId,
      role: user.role,
      accountStatus: user.accountStatus,
    };

    const newAccessToken = generateAccessToken(payload);
    const newRefreshToken = generateRefreshToken(payload);

    // Save new refresh token
    const hashedNewToken = this.hashToken(newRefreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await authRepository.saveRefreshToken(user.id, hashedNewToken, expiresAt);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  /**
   * Logout - Revoke refresh token
   */
  async logout(refreshToken: string): Promise<void> {
    const hashedToken = this.hashToken(refreshToken);
    const tokenRecord = await authRepository.findRefreshToken(hashedToken);

    // Revoke if exists — don't throw if not found (token may have expired)
    if (tokenRecord && !tokenRecord.isRevoked) {
      await authRepository.revokeRefreshToken(tokenRecord.id);
    }
  }

  /**
   * Forgot Password - Generate and send OTP
   */
  async forgotPassword(data: ForgotPasswordInput) {
    const { universityId } = data;

    // Find user
    const user = await authRepository.findByUniversityIdForAuth(universityId);

    // Don't reveal if user exists or not (security)
    if (!user) {
      return { message: 'If this account exists, an OTP has been sent to your email' };
    }

    // Check account status
    if (user.accountStatus === 'SUSPENDED' || user.accountStatus === 'SEAT_CANCELLED') {
      throw new AppError('Your account is not active. Contact hall office.', 403);
    }

    // Generate 6-digit OTP
    const otp = randomInt(100000, 999999).toString();

    // Hash OTP
    const hashedOTP = await hashPassword(otp);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    // Store OTP with 15-minute expiry
    await authRepository.setPasswordResetToken(user.id, hashedOTP, expiresAt);

    // Send OTP via email
    await emailService.sendPasswordResetOTP(user.email, user.name, otp);

    return { message: 'If this account exists, an OTP has been sent to your email' };
  }

  /**
   * Reset Password - Verify OTP and set new password
   */
  async resetPassword(data: ResetPasswordInput) {
    const { universityId, otp, newPassword } = data;
    const user = await authRepository.findByUniversityIdForAuth(universityId);

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

    // Revoke all refresh tokens on password reset (security)
    await authRepository.revokeAllUserRefreshTokens(user.id);

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
    const user = await authRepository.findByIdForAuth(userId);

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
