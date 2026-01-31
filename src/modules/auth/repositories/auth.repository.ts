import prisma from '@/config/database.config';
import { User } from '@prisma/client';

class AuthRepository {
  /**
   * Find user by university ID
   */
  async findByUniversityId(universityId: string): Promise<User | null> {
    return await prisma.user.findUnique({
      where: { universityId },
    });
  }

  /**
   * Find user by ID
   */
  async findById(userId: string): Promise<User | null> {
    return await prisma.user.findUnique({
      where: { id: userId },
    });
  }

  /**
   * Update user password
   */
  async updatePassword(userId: string, hashedPassword: string): Promise<User> {
    return await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        passwordChangedAt: new Date(),
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
  async setPasswordResetToken(userId: string, hashedToken: string, expiresAt: Date): Promise<User> {
    return await prisma.user.update({
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
  async clearPasswordResetToken(userId: string): Promise<User> {
    return await prisma.user.update({
      where: { id: userId },
      data: {
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    });
  }
}

export default new AuthRepository();
