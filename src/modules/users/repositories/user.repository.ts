import { AccountStatus, Prisma, User, UserRole } from '@prisma/client';
import {
  UserFilterOptions,
  PaginationOptions,
  CreateUserInput,
  UpdateUserInput,
} from '../types/user.types';
import prisma from '@/config/database.config';

/**
 * User Repository
 * Handles all database operations for users
 * This is the ONLY place where Prisma queries exist for users
 */
class UserRepository {
  /**
   * Find user by ID
   */
  async findById(userId: string) {
    return await prisma.user.findUnique({
      where: { id: userId, isDeleted: false },
      include: {
        currentRoom: {
          select: { id: true, roomNumber: true, floor: true, wing: true, roomType: true },
        },
        emergencyContacts: true,
        guardianInfo: true,
      },
    });
  }

  /**
   * Find user by university ID
   */
  async findByUniversityId(universityId: string) {
    return await prisma.user.findUnique({
      where: { universityId, isDeleted: false },
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
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    return await prisma.user.findUnique({
      where: { email, isDeleted: false },
    });
  }

  /**
   * Find all users with filters and pagination
   */
  async findMany(
    filters: UserFilterOptions,
    pagination: PaginationOptions,
  ): Promise<{ users: User[]; total: number }> {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.UserWhereInput = {
      isDeleted: false,
      ...(filters.role && { role: filters.role }),
      ...(filters.accountStatus && { accountStatus: filters.accountStatus }),
      ...(filters.department && { department: filters.department }),
      ...(filters.year && { year: filters.year }),
      ...(filters.program && { program: filters.program }),
      ...(filters.assignedFloor && { assignedFloor: filters.assignedFloor }),
      ...(filters.search && {
        OR: [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { email: { contains: filters.search, mode: 'insensitive' } },
          { universityId: { contains: filters.search, mode: 'insensitive' } },
        ],
      }),
    };
    // Execute queries in parallel
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
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
        },
      }),
      prisma.user.count({ where }),
    ]);

    return { users, total };
  }

  /**
   * Create new user
   */
  async create(
    data: CreateUserInput,
    hashedPassword: string,
    oneTimePassword: string,
    otpExpiresAt: Date,
  ): Promise<User> {
    return await prisma.user.create({
      data: {
        ...data,
        password: hashedPassword,
        oneTimePassword,
        otpExpiresAt,
        isFirstLogin: true,
        accountStatus: 'ACTIVE',
      },
    });
  }

  /**
   * Update user
   */
  async update(userId: string, data: UpdateUserInput): Promise<User> {
    return await prisma.user.update({
      where: { id: userId },
      data: {
        ...data,
        updatedAt: new Date(),
      },
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
      },
    });
  }

  /**
   * Update user role (admin only)
   */
  async updateRole(userId: string, role: UserRole): Promise<User> {
    return await prisma.user.update({
      where: { id: userId },
      data: { role, updatedAt: new Date() },
    });
  }

  /**
   * Update account status
   */
  async updateAccountStatus(userId: string, accountStatus: AccountStatus): Promise<User> {
    return await prisma.user.update({
      where: { id: userId },
      data: { accountStatus, updatedAt: new Date() },
    });
  }

  /**
   * Soft delete user
   */
  async softDelete(userId: string, deletedBy: string): Promise<void> {
    await prisma.$transaction([
      prisma.refreshToken.updateMany({
        where: { userId },
        data: { isRevoked: true, revokedAt: new Date() },
      }),
      prisma.user.update({
        where: { id: userId },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
          accountStatus: 'INACTIVE',
          email: `deleted_${userId}@deleted.com`,
          phone: 'DELETED',
          cancelledBy: deletedBy,
          cancelledAt: new Date(),
        },
      }),
    ]);
  }

  /**
   * Restore soft-deleted user
   */
  async restore(userId: string): Promise<User> {
    return await prisma.user.update({
      where: { id: userId },
      data: {
        isDeleted: false,
        deletedAt: null,
        accountStatus: 'ACTIVE',
      },
    });
  }

  /**
   * Hard delete user (use with extreme caution!)
   */
  async hardDelete(userId: string): Promise<User> {
    return await prisma.user.delete({
      where: { id: userId },
    });
  }

  /**
   * Check if university ID exists
   */
  async universityIdExists(universityId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { universityId },
      select: { id: true },
    });
    return !!user;
  }

  /**
   * Check if email exists
   */
  async emailExists(email: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    return !!user;
  }

  /**
   * Get user statistics
   */
  async getStatistics() {
    const [
      totalUsers,
      activeUsers,
      inactiveUsers,
      suspendedUsers,
      roleDistribution,
      departmentDistribution,
      yearDistribution,
      newUsersThisMonth,
      newUsersThisYear,
    ] = await Promise.all([
      // Total users
      prisma.user.count({ where: { isDeleted: false } }),

      // Active users
      prisma.user.count({
        where: { accountStatus: 'ACTIVE', isDeleted: false },
      }),

      // Inactive users
      prisma.user.count({
        where: { accountStatus: 'INACTIVE', isDeleted: false },
      }),

      // Suspended users
      prisma.user.count({
        where: { accountStatus: 'SUSPENDED', isDeleted: false },
      }),

      // Role distribution
      prisma.user.groupBy({
        by: ['role'],
        where: { isDeleted: false },
        _count: { role: true },
      }),

      // Department distribution (students only)
      prisma.user.groupBy({
        by: ['department'],
        where: {
          role: 'STUDENT',
          isDeleted: false,
          department: { not: null },
        },
        _count: { department: true },
      }),

      // Year distribution (students only)
      prisma.user.groupBy({
        by: ['year'],
        where: {
          role: 'STUDENT',
          isDeleted: false,
          year: { not: null },
        },
        _count: { year: true },
      }),

      // New users this month
      prisma.user.count({
        where: {
          isDeleted: false,
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
      /** 'gte' means "Greater Than or Equal To" (>=).
       * new Date(year, month, 1): This creates a timestamp for the 1st day of the current month at 12:00 AM.
       * gte: Tells the database to look for any user whose createdAt date is Greater Than or Equal to that 1st day.
       * In JavaScript, months start at 0. So, January is 0, and December is 11
       */

      // New users this year
      prisma.user.count({
        where: {
          isDeleted: false,
          createdAt: {
            gte: new Date(new Date().getFullYear(), 0, 1),
          },
        },
      }),
    ]);

    return {
      totalUsers,
      activeUsers,
      inactiveUsers,
      suspendedUsers,
      byRole: roleDistribution.map((r) => ({
        role: r.role,
        count: r._count.role,
      })),
      byDepartment: departmentDistribution.map((d) => ({
        department: d.department!,
        count: d._count.department,
      })),
      byYear: yearDistribution.map((y) => ({
        year: y.year!,
        count: y._count.year,
      })),
      newUsersThisMonth,
      newUsersThisYear,
    };
  }

  /**
   * Bulk create users (for admin/seeding)
   */
  async bulkCreate(
    users: CreateUserInput[],
    hashedPasswords: string[],
    otps: string[],
  ): Promise<number> {
    const data = users.map((user, index) => ({
      ...user,
      password: hashedPasswords[index],
      oneTimePassword: otps[index],
      isFirstLogin: true,
      accountStatus: 'ACTIVE' as AccountStatus,
    }));

    const result = await prisma.user.createMany({
      data,
      skipDuplicates: true, // Skip if university ID or email already exists
    });

    return result.count;
  }

  /**
   * Update profile picture
   */
  async updateProfilePicture(userId: string, photoUrl: string): Promise<User> {
    return await prisma.user.update({
      where: { id: userId },
      data: { photo: photoUrl, updatedAt: new Date() },
    });
  }

  /**
   * Delete profile picture
   */
  async deleteProfilePicture(userId: string): Promise<User> {
    return await prisma.user.update({
      where: { id: userId },
      data: { photo: null, updatedAt: new Date() },
    });
  }

  /**
   * Get users by role
   */
  async findByRole(role: UserRole): Promise<User[]> {
    return await prisma.user.findMany({
      where: { role, isDeleted: false, accountStatus: 'ACTIVE' },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Get users by floor (for house tutors)
   */
  async findByFloor(floor: number): Promise<User[]> {
    return await prisma.user.findMany({
      where: {
        role: 'STUDENT',
        isDeleted: false,
        accountStatus: 'ACTIVE',
        currentRoom: {
          floor,
        },
      },
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
      },
      orderBy: { name: 'asc' },
    });
  }
}

export default new UserRepository();
