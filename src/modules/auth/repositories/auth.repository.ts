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
   * Update in failed login attempts and optionally lock account
   */
  async updateFailedAttempts(userId: string, attempts: number, shouldLock: boolean = false) {
    return await prisma.user.update({
      where: { id: userId },
      data: {
        failedLoginAttempts: attempts,
        ...(shouldLock && { accountStatus: 'LOCKED' }),
      },
    });
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
