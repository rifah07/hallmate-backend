import prisma from '@/config/database.config';
import { User } from '@prisma/client';

class AuthRepository {
  /**
   * Find user by university ID
   */

  // Used ONLY for auth operations that need sensitive fields
  async findByUniversityIdForAuth(universityId: string): Promise<User | null> {
    return await prisma.user.findUnique({
      where: { universityId, isDeleted: false },
    });
  }

  /**
   * Find user by ID
   */
  async findByIdForAuth(userId: string): Promise<User | null> {
    return await prisma.user.findUnique({
      where: { id: userId, isDeleted: false },
    });
  }
  /**
   * Update user password
   */
  async updatePassword(userId: string, hashedPassword: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        passwordChangedAt: new Date(),
      },
    });
  }

  /**
   * Count a wrong password; after `max` in a row, lock for `lockMs`.
   * The increment is atomic so parallel guesses can't skip the count.
   * Returns true when this attempt triggered the lock.
   */
  async recordFailedLogin(userId: string, max: number, lockMs: number): Promise<boolean> {
    const { failedLoginAttempts } = await prisma.user.update({
      where: { id: userId },
      data: { failedLoginAttempts: { increment: 1 } },
      select: { failedLoginAttempts: true },
    });
    if (failedLoginAttempts < max) return false;
    await prisma.user.update({
      where: { id: userId },
      data: { failedLoginAttempts: 0, lockedUntil: new Date(Date.now() + lockMs) },
    });
    return true;
  }

  async clearFailedLogins(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { failedLoginAttempts: 0, lockedUntil: null },
    });
  }

  /** Count a wrong one-time or reset code; returns the new total. */
  async recordFailedOtp(userId: string): Promise<number> {
    const { otpAttempts } = await prisma.user.update({
      where: { id: userId },
      data: { otpAttempts: { increment: 1 } },
      select: { otpAttempts: true },
    });
    return otpAttempts;
  }

  /**
   * Update user on first login
   */
  async completeFirstLogin(userId: string, hashedPassword: string): Promise<User> {
    return await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        isFirstLogin: false,
        oneTimePassword: null,
        otpExpiresAt: null,
        otpAttempts: 0,
        passwordChangedAt: new Date(),
      },
    });
  }

  /**
   * Set password reset token
   */
  async setPasswordResetToken(userId: string, hashedToken: string, expiresAt: Date): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: {
        passwordResetToken: hashedToken,
        passwordResetExpires: expiresAt,
        otpAttempts: 0,
      },
    });
  }

  /**
   * Clear password reset token
   */
  async clearPasswordResetToken(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: {
        passwordResetToken: null,
        passwordResetExpires: null,
        otpAttempts: 0,
        // A completed reset proves inbox ownership: lift a brute-force lock too
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });
  }

  // Refresh token operations
  async saveRefreshToken(
    userId: string,
    hashedToken: string,
    expiresAt: Date,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    await prisma.refreshToken.create({
      data: {
        token: hashedToken,
        userId,
        expiresAt,
        ipAddress,
        userAgent,
      },
    });
  }

  async findRefreshToken(hashedToken: string) {
    return await prisma.refreshToken.findUnique({
      where: { token: hashedToken },
      include: { user: true },
    });
  }

  async revokeRefreshToken(tokenId: string): Promise<void> {
    await prisma.refreshToken.update({
      where: { id: tokenId },
      data: { isRevoked: true, revokedAt: new Date() },
    });
  }

  async revokeAllUserRefreshTokens(userId: string): Promise<void> {
    await prisma.refreshToken.updateMany({
      where: { userId, isRevoked: false },
      data: { isRevoked: true, revokedAt: new Date() },
    });
  }
}

export default new AuthRepository();
