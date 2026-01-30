import { UserResponse } from '../types/user.types';

class UserService {
  /**
   * Transform User entity to UserResponse (exclude sensitive data)
   */

  private toUserResponse(user: any): UserResponse {
    const {
      password,
      oneTimePassword,
      otpExpiresAt,
      passwordResetToken,
      passwordResetExpires,
      isDeleted,
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
}

export default new UserService();
