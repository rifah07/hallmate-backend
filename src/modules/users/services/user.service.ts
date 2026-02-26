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
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from '@/shared/errors';
import { hashPassword, generateOTP } from '@/shared/utils/crypto/password.util';
import emailService from '@/shared/utils/email/email.service';
import { cloudinaryService } from '@/shared/shared/services/cloudinary.service';
import { UserRole } from '@prisma/client';

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

  async getUserByUniversityId(universityId: string): Promise<UserResponse> {
    const user = await userRepository.findByUniversityId(universityId);
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

  async updateUser(
    userId: string,
    data: UpdateUserInput,
    requesterId: string,
  ): Promise<UserResponse> {
    const existing = await userRepository.findById(userId);
    if (!existing) throw new NotFoundError('User not found');

    // Ownership check — students can only edit themselves
    // Admins can edit anyone
    if (existing.id !== requesterId) {
      const requester = await userRepository.findById(requesterId);
      if (!requester || !['SUPER_ADMIN', 'PROVOST', 'HOUSE_TUTOR'].includes(requester.role)) {
        throw new ForbiddenError('You can only update your own profile');
      }
    }

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

  async uploadProfilePicture(
    userId: string,
    file: Express.Multer.File,
    requestingUserId: string,
    requestingUserRole: UserRole,
  ): Promise<UserResponse> {
    if (
      userId !== requestingUserId &&
      !['SUPER_ADMIN', 'ADMIN', 'PROVOST'].includes(requestingUserRole)
    ) {
      throw new ForbiddenError('You can only upload your own profile picture');
    }

    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Validate file
    const validation = cloudinaryService.validateImageFile(file);
    if (!validation.valid) {
      throw new BadRequestError(validation.error || 'Invalid image file');
    }

    // Delete old profile picture from Cloudinary if exists
    if (user.photo) {
      const publicId = cloudinaryService.extractPublicId(user.photo);
      if (publicId) {
        try {
          await cloudinaryService.deleteImage(publicId);
        } catch (error) {
          // Log error but don't fail the upload
          console.error('Failed to delete old profile picture:', error);
        }
      }
    }

    // Upload new image to Cloudinary
    const uploadResult = await cloudinaryService.uploadImage(
      file.buffer,
      'hallmate/profile-pictures',
      {
        public_id: `user_${userId}`, // Use user ID as public ID for easy management
        transformation: [
          { width: 500, height: 500, crop: 'fill', gravity: 'face' }, // Auto-crop to face
          { quality: 'auto', fetch_format: 'auto' },
        ],
      },
    );

    // Update user with new profile picture URL
    const updatedUser = await userRepository.updateProfilePicture(userId, uploadResult.url);

    return this.toUserResponse(updatedUser);
  }

  async deleteProfilePicture(
    userId: string,
    requestingUserId: string,
    requestingUserRole: UserRole,
  ): Promise<UserResponse> {
    /*  const existing = await userRepository.findById(userId);
    if (!existing) throw new NotFoundError('User not found');

    if (existing.id !== requesterId) {
      const requester = await userRepository.findById(requesterId);
      if (!requester || !['SUPER_ADMIN', 'PROVOST'].includes(requester.role)) {
        throw new ForbiddenError('You can only delete your own profile picture');
      }
    } */

    if (
      userId !== requestingUserId &&
      !['SUPER_ADMIN', 'ADMIN', 'PROVOST'].includes(requestingUserRole)
    ) {
      throw new ForbiddenError('You can only delete your own profile picture');
    }

    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (!user.photo) {
      throw new BadRequestError('User does not have a profile picture');
    }

    // Delete from Cloudinary
    const publicId = cloudinaryService.extractPublicId(user.photo);
    if (publicId) {
      try {
        await cloudinaryService.deleteImage(publicId);
      } catch (error) {
        // Log error but continue to remove from database
        console.error('Failed to delete from Cloudinary:', error);
      }
    }

    // Remove from database
    const updatedUser = await userRepository.deleteProfilePicture(userId);

    return this.toUserResponse(updatedUser);
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
