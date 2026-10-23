import { createHash, randomInt } from 'crypto';
import { hashPassword, comparePassword } from '@/shared/utils/crypto/password.util';
import { generateAccessToken, generateRefreshToken } from '@/shared/utils/crypto/jwt.util';
import { AppError, ForbiddenError, UnauthorizedError } from '@/shared/errors';
import {
  LoginInput,
  FirstTimeLoginInput,
  ChangePasswordInput,
  ResetPasswordInput,
  ForgotPasswordInput,
} from '../validations/auth.validation';
import emailService from '@/shared/utils/email/email.service';
import authRepository from '../repositories/auth.repository';

const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_LOCK_MS = 15 * 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;
// Statuses that may not sign in or keep a session (authenticate.ts agrees)
const BLOCKED_STATUS_MESSAGES: Record<string, string> = {
  LOCKED: 'Your account has been locked. Contact the hall office.',
  SUSPENDED: 'Your account has been suspended. Contact the hall office.',
  SEAT_CANCELLED: 'Your seat has been cancelled. Contact the hall office.',
  INACTIVE: 'Your account is not active. Contact the hall office.',
  GRADUATED: 'Your residency has ended. Contact the hall office.',
};
// Compared against when the account doesn't exist, so a wrong university ID
// takes as long as a wrong password and response time reveals nothing.
const dummyHash = hashPassword('timing-equaliser-not-a-password');

class AuthService {
  // Helper to hash refresh token before storing
  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
  async login(data: LoginInput) {
    const { universityId, password } = data;

    const user = await authRepository.findByUniversityIdForAuth(universityId);
    const isPasswordValid = await comparePassword(password, user?.password ?? (await dummyHash));

    if (!user || user.isDeleted) {
      throw new UnauthorizedError('Invalid credentials');
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new ForbiddenError('Too many failed attempts. Try again in 15 minutes.');
    }

    if (!isPasswordValid) {
      // New accounts sign in with a one-time password on a separate form;
      // point them there without revealing anything to a guesser.
      if (
        user.isFirstLogin &&
        user.oneTimePassword &&
        (await comparePassword(password, user.oneTimePassword))
      ) {
        throw new AppError('First-time login required. Please set your password first.', 403);
      }
      const locked = await authRepository.recordFailedLogin(
        user.id,
        MAX_LOGIN_ATTEMPTS,
        LOGIN_LOCK_MS,
      );
      if (locked) throw new ForbiddenError('Too many failed attempts. Try again in 15 minutes.');
      throw new UnauthorizedError('Invalid credentials');
    }

    // Never issue tokens before activation, whatever the stored password is
    if (user.isFirstLogin) {
      throw new AppError('First-time login required. Please set your password first.', 403);
    }

    // Status is only revealed to someone who knows the password
    const blocked = BLOCKED_STATUS_MESSAGES[user.accountStatus];
    if (blocked) throw new ForbiddenError(blocked);

    if (user.failedLoginAttempts > 0 || user.lockedUntil) {
      await authRepository.clearFailedLogins(user.id);
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

    // One answer for every failure, so this form can't be used to find
    // which university IDs exist or are still unactivated.
    const invalid = new AppError('Invalid university ID or one-time password', 401);
    if (!user || !user.isFirstLogin || !user.oneTimePassword) {
      await dummyHash.then((hash) => comparePassword(oneTimePassword, hash));
      throw invalid;
    }

    if (user.otpAttempts >= MAX_OTP_ATTEMPTS) {
      throw new AppError(
        'Too many wrong codes. Ask the hall office for a new one-time password.',
        403,
      );
    }

    if (user.otpExpiresAt && new Date() > user.otpExpiresAt) {
      throw new AppError(
        'This one-time password has expired. Ask the hall office for a new one.',
        400,
      );
    }

    const isOTPValid = await comparePassword(oneTimePassword, user.oneTimePassword);
    if (!isOTPValid) {
      await authRepository.recordFailedOtp(user.id);
      throw invalid;
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

    const blocked = BLOCKED_STATUS_MESSAGES[user.accountStatus];
    if (blocked) throw new ForbiddenError(blocked);

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

    // Blocked accounts get the same reply and no email
    if (BLOCKED_STATUS_MESSAGES[user.accountStatus]) {
      return { message: 'If this account exists, an OTP has been sent to your email' };
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

    // A 6-digit code is guessable without a cap; 5 tries, then a new code
    if (user.otpAttempts >= MAX_OTP_ATTEMPTS) {
      await authRepository.clearPasswordResetToken(user.id);
      throw new AppError('Too many wrong codes. Please request a new one.', 400);
    }

    const isOTPValid = await comparePassword(otp, user.passwordResetToken);
    if (!isOTPValid) {
      await authRepository.recordFailedOtp(user.id);
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

    await authRepository.updatePassword(user.id, hashedPassword);
    // Whoever knew the old password may hold a session: end them all
    await authRepository.revokeAllUserRefreshTokens(user.id);

    // Send confirmation email
    await emailService.sendPasswordChangedConfirmation(user.email, user.name);

    return {
      message: 'Password changed successfully',
    };
  }
}

export default new AuthService();
