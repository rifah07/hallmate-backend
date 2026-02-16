import prisma from '@/config/database.config';
import { UserResponse } from '../types/user.types';
import { AppError } from 'shared/errors';
class UserService {
  /**
   * Transform User entity to UserResponse (exclude sensitive data)
   */

  private toUserResponse(user: any): UserResponse {
    const {
      _password,
      _oneTimePassword,
      _otpExpiresAt,
      _passwordResetToken,
      _passwordResetExpires,
      _isDeleted,
      ...safeUser
    } = user;

    return {
      ...safeUser,
      currentRoom: user.currentRoom
        ? {
            id: user.currentRoom.id,
            roomNumber: user.currentRoom.roomNumber,
            floor: user.currentRoom.floor,
            wing: user.currentRoom.wing,
            roomType: user.currentRoom.roomType,
          }
        : undefined,
    } as UserResponse;
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<UserResponse> {
    const user = await prisma.user.findUnique({
      where: { id: userId, isDeleted: false },
      include: {
        currentRoom: {
          select: {
            id: true,
            roomNumber: true,
            floor: true,
            wing: true,
            roomType: true,
          },
        },
        emergencyContacts: true,
        guardianInfo: true,
      },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }
    return this.toUserResponse(user);
  }
}

export default new UserService();
