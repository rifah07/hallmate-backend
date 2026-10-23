import { randomBytes } from 'node:crypto';
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
import { cloudinaryService } from '@/shared/services/cloudinary.service';
import { UserRole } from '@prisma/client';
import logger from '@/shared/utils/logger.util';

class UserService {
  private editableFields(
    requester: { id: string; role: string; assignedFloor: number | null },
    target: { id: string; role: string; currentRoom: { floor: number } | null },
  ): Set<string> {
    const personal = ['phone', 'bloodGroup', 'medicalConditions', 'allergies'];
    const academic = ['name', 'department', 'year', 'program', 'session'];

    if (requester.role === 'SUPER_ADMIN') {
      return new Set([
        ...personal,
        ...academic,
        'email',
        'provostMessage',
        'assignedFloor',
        'designation',
      ]);
    }
    if (requester.role === 'PROVOST' && target.role !== 'SUPER_ADMIN') {
      return new Set([
        ...personal,
        ...academic,
        'email',
        'provostMessage',
        'assignedFloor',
        'designation',
      ]);
    }
    // A house tutor looks after the students on her floor, nobody else
    if (
      requester.role === 'HOUSE_TUTOR' &&
      target.role === 'STUDENT' &&
      requester.assignedFloor != null &&
      target.currentRoom?.floor === requester.assignedFloor
    ) {
      return new Set([...personal, ...academic]);
    }
    if (requester.id === target.id) {
      return new Set(requester.role === 'PROVOST' ? [...personal, 'provostMessage'] : personal);
    }
    throw new ForbiddenError('You can only update your own profile');
  }

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
      hashPassword(randomBytes(32).toString('hex')), // unusable; the real one is set at first login
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
    const requester =
      existing.id === requesterId ? existing : await userRepository.findById(requesterId);
    if (!requester) throw new ForbiddenError('You can only update your own profile');

    // Email is where password-reset codes go, so changing it is an account
    // takeover unless only the hall's top admins can do it.
    const allowed = this.editableFields(requester, existing);
    const blocked = Object.keys(data).filter((field) => !allowed.has(field));
    if (blocked.length > 0) {
      throw new ForbiddenError(`You cannot change: ${blocked.join(', ')}`);
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
    //requestingUserId: string,
    requestingUserRole: UserRole,
  ): Promise<UserResponse> {
    if (!['SUPER_ADMIN', 'ADMIN', 'PROVOST'].includes(requestingUserRole)) {
      throw new ForbiddenError(
        'Only Admin, provost or House-Tutor can upload profile picture for a user',
      );
    }

    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

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

    const updatedUser = await userRepository.updateProfilePicture(userId, uploadResult.url);
    return this.toUserResponse(updatedUser);
  }

  async deleteProfilePicture(
    userId: string,
    // requestingUserId: string,
    requestingUserRole: UserRole,
  ): Promise<UserResponse> {
    if (!['SUPER_ADMIN', 'ADMIN', 'PROVOST'].includes(requestingUserRole)) {
      throw new ForbiddenError(
        'Only Admin, provost or House-Tutor can delete profile picture for a user',
      );
    }

    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (!user.photo) {
      throw new BadRequestError('User does not have a profile picture');
    }

    const publicId = cloudinaryService.extractPublicId(user.photo);
    if (publicId) {
      try {
        await cloudinaryService.deleteImage(publicId);
      } catch (error) {
        // Log error but continue to remove from database
        console.error('Failed to delete from Cloudinary:', error);
      }
    }

    const updatedUser = await userRepository.deleteProfilePicture(userId);
    return this.toUserResponse(updatedUser);
  }

  getOptimizedProfilePicture(
    profilePictureUrl: string,
    options: {
      width?: number;
      height?: number;
      quality?: string;
    } = {},
  ): string {
    const publicId = cloudinaryService.extractPublicId(profilePictureUrl);
    if (!publicId) {
      return profilePictureUrl; // Return original if can't extract public ID
    }

    return cloudinaryService.getOptimizedUrl(publicId, {
      width: options.width || 200,
      height: options.height || 200,
      crop: 'fill',
      quality: options.quality || 'auto',
      format: 'auto',
    });
  }

  async deleteUser(userId: string, deletedBy: string): Promise<void> {
    const existing = await userRepository.findById(userId);
    if (!existing) throw new NotFoundError('User not found');

    await userRepository.softDelete(userId, deletedBy);
  }

  async reissueOneTimePassword(userId: string, actorId: string): Promise<UserResponse> {
    const existing = await userRepository.findById(userId);
    if (!existing) throw new NotFoundError('User not found');
    // Activated accounts recover through "forgot password" instead
    if (!existing.isFirstLogin) {
      throw new BadRequestError('This account is already activated. Use forgot password instead.');
    }

    const otp = generateOTP();
    const otpExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const user = await userRepository.reissueOneTimePassword(
      userId,
      await hashPassword(otp),
      otpExpiresAt,
      actorId,
    );
    await emailService.sendWelcomeEmail(user.email, user.name, otp);
    return this.toUserResponse(user);
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
      Promise.all(usersData.map(() => hashPassword(randomBytes(32).toString('hex')))),
      Promise.all(otps.map((otp) => hashPassword(otp))),
    ]);

    const count = await userRepository.bulkCreate(usersData, hashedPasswords, hashedOTPs);

    // SEND EMAILS
    for (let i = 0; i < usersData.length; i++) {
      try {
        await emailService.sendWelcomeEmail(usersData[i].email, usersData[i].name, otps[i]);
      } catch (err) {
        logger.error(`Failed email for ${usersData[i].email}`, err);
      }
    }
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
