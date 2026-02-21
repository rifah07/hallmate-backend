/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import userRepository from '../repositories/user.repository';
import {
  UserResponse,
  UserListResponse,
  CreateUserInput,
  UpdateUserInput,
  UserFilterOptions,
  PaginationOptions,
} from '../types/user.types';
import { ConflictError, NotFoundError } from '@/shared/errors';
import { hashPassword, generateOTP } from '@/shared/utils/crypto/password.util';
import emailService from '@/shared/utils/email/email.service';

class UserService {
  private toUserResponse(user: any): UserResponse {
    const {
      password,
      oneTimePassword,
      otpExpiresAt,
      passwordResetToken,
      passwordResetExpires,
      isDeleted,
      deletedAt,
      cancelledBy,
      cancelledAt,
      cancellationReason,
      createdBy,
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

  async getUserById(userId: string): Promise<UserResponse> {
    const user = await userRepository.findById(userId);
    if (!user) throw new NotFoundError('User not found');
    return this.toUserResponse(user);
  }

  async getAllUsers(
    filters: UserFilterOptions,
    pagination: PaginationOptions,
  ): Promise<UserListResponse> {
    const page = pagination.page ?? 1;
    const limit = Math.min(pagination.limit ?? 20, 100); // enforce max 100

    const { users, total } = await userRepository.findMany(filters, { ...pagination, page, limit });

    return {
      users: users.map((u) => this.toUserResponse(u)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async createUser(data: CreateUserInput): Promise<UserResponse> {
    // Check for duplicates
    const [uniIdExists, emailExists] = await Promise.all([
      userRepository.universityIdExists(data.universityId),
      userRepository.emailExists(data.email),
    ]);

    if (uniIdExists) throw new ConflictError('University ID already exists');
    if (emailExists) throw new ConflictError('Email already exists');

    // Generate OTP and hash password
    const otp = generateOTP();
    const [hashedPassword, hashedOTP] = await Promise.all([
      hashPassword('PLACEHOLDER'), // placeholder — user sets real password on first login
      hashPassword(otp),
    ]);

    const otpExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const user = await userRepository.create(data, hashedPassword, hashedOTP, otpExpiresAt);

    // Send OTP via email
    await emailService.sendWelcomeEmail(user.email, user.name, otp);

    return this.toUserResponse(user);
  }

  async updateUser(userId: string, data: UpdateUserInput): Promise<UserResponse> {
    const existing = await userRepository.findById(userId);
    if (!existing) throw new NotFoundError('User not found');

    // If email is being changed, check it's not taken
    if (data.email && data.email !== existing.email) {
      const emailExists = await userRepository.emailExists(data.email);
      if (emailExists) throw new ConflictError('Email already in use');
    }

    const user = await userRepository.update(userId, data);
    return this.toUserResponse(user);
  }

  async updateUserRole(userId: string, role: string): Promise<UserResponse> {
    const existing = await userRepository.findById(userId);
    if (!existing) throw new NotFoundError('User not found');

    const user = await userRepository.updateRole(userId, role as any);
    return this.toUserResponse(user);
  }

  async updateAccountStatus(userId: string, accountStatus: string): Promise<UserResponse> {
    const existing = await userRepository.findById(userId);
    if (!existing) throw new NotFoundError('User not found');

    const user = await userRepository.updateAccountStatus(userId, accountStatus as any);
    return this.toUserResponse(user);
  }

  async deleteUser(userId: string, deletedBy: string): Promise<void> {
    const existing = await userRepository.findById(userId);
    if (!existing) throw new NotFoundError('User not found');

    await userRepository.softDelete(userId, deletedBy);
  }

  async restoreUser(userId: string): Promise<UserResponse> {
    const user = await userRepository.restore(userId);
    return this.toUserResponse(user);
  }

  async getUserStatistics() {
    return await userRepository.getStatistics();
  }

  async bulkCreateUsers(usersData: CreateUserInput[]): Promise<{ created: number }> {
    const otps = usersData.map(() => generateOTP());
    const [hashedPasswords, hashedOTPs] = await Promise.all([
      Promise.all(usersData.map(() => hashPassword('PLACEHOLDER'))),
      Promise.all(otps.map((otp) => hashPassword(otp))),
    ]);

    const count = await userRepository.bulkCreate(usersData, hashedPasswords, hashedOTPs);
    return { created: count };
  }

  async getUsersByRole(role: string): Promise<UserResponse[]> {
    const users = await userRepository.findByRole(role as any);
    return users.map((u) => this.toUserResponse(u));
  }

  async getUsersByFloor(floor: number): Promise<UserResponse[]> {
    const users = await userRepository.findByFloor(floor);
    return users.map((u) => this.toUserResponse(u));
  }
}

export default new UserService();
