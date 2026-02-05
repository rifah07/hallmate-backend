import { AccountStatus, Prisma, PrismaClient, User, UserRole } from '@prisma/client';
import {
  UserFilterOptions,
  PaginationOptions,
  CreateUserInput,
  UpdateUserInput,
} from '../types/user.types';

/**
 * User Repository
 * Handles all database operations for users
 * This is the ONLY place where Prisma queries exist for users
 */
export class UserRepository {
  constructor(private prisma: PrismaClient) {}

  /**
   * Find user by ID
   */
  async findById(userId: string): Promise<User | null> {
    return await this.prisma.user.findUnique({
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
  }

  /**
   * Find user by university ID
   */
  async findByUniversityId(universityId: string): Promise<User | null> {
    return await this.prisma.user.findUnique({
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
    return await this.prisma.user.findUnique({
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
      this.prisma.user.findMany({
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
      this.prisma.user.count({ where }),
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
  ): Promise<User> {
    return await this.prisma.user.create({
      data: {
        ...data,
        password: hashedPassword,
        oneTimePassword,
        isFirstLogin: true,
        accountStatus: 'ACTIVE',
      },
      include: {
        currentRoom: true,
      },
    });
  }

  /**
   * Update user
   */
  async update(userId: string, data: UpdateUserInput): Promise<User> {
    return await this.prisma.user.update({
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
    return await this.prisma.user.update({
      where: { id: userId },
      data: { role, updatedAt: new Date() },
    });
  }

  /**
   * Update account status
   */
  async updateAccountStatus(userId: string, accountStatus: AccountStatus): Promise<User> {
    return await this.prisma.user.update({
      where: { id: userId },
      data: { accountStatus, updatedAt: new Date() },
    });
  }
}
