import { UserRole, AccountStatus, Program, BloodGroup, Wing, RoomType } from '@prisma/client';

/**
 * User Response DTO (Data Transfer Object)
 * What we return to the client (excludes sensitive data)
 */
export interface UserResponse {
  id: string;
  universityId: string;
  role: UserRole;
  name: string;
  email: string;
  phone: string;
  photo?: string;
  accountStatus: AccountStatus;

  // Student-specific
  department?: string;
  year?: number;
  program?: Program;
  session?: string;
  bloodGroup?: BloodGroup;
  medicalConditions?: string;
  allergies?: string;

  // Room info
  currentRoomId?: string;
  currentRoom?: {
    id: string;
    roomNumber: string;
    floor: number;
    wing: Wing;
    roomType: RoomType;
  };

  // Provost-specific
  provostMessage?: string;
  tenureStart?: Date;
  tenureEnd?: Date;

  // House Tutor-specific
  assignedFloor?: number;

  // Staff-specific
  designation?: string;
  joiningDate?: Date;

  createdAt: Date;
  updatedAt: Date;
}

/**
 * User List Response with Pagination
 */
export interface UserListResponse {
  users: UserResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * User Statistics Response
 */
export interface UserStatistics {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  suspendedUsers: number;

  byRole: {
    role: UserRole;
    count: number;
  }[];

  byDepartment: {
    department: string;
    count: number;
  }[];

  byYear: {
    year: number;
    count: number;
  }[];

  newUsersThisMonth: number;
  newUsersThisYear: number;
}

/**
 * User Create Input
 */
export interface CreateUserInput {
  universityId: string;
  role: UserRole;
  name: string;
  email: string;
  phone: string;

  // Student-specific
  department?: string;
  year?: number;
  program?: Program;
  session?: string;
  bloodGroup?: BloodGroup;
  nationalId?: string;
  medicalConditions?: string;
  allergies?: string;

  // Provost-specific
  provostMessage?: string;
  tenureStart?: Date;
  tenureEnd?: Date;

  // House Tutor-specific
  assignedFloor?: number;

  // Staff-specific
  designation?: string;
  joiningDate?: Date;
}

/**
 * User Update Input
 */
export interface UpdateUserInput {
  name?: string;
  email?: string;
  phone?: string;
  photo?: string;

  // Student-specific
  department?: string;
  year?: number;
  bloodGroup?: BloodGroup;
  medicalConditions?: string;
  allergies?: string;

  // Provost-specific
  provostMessage?: string;

  // House Tutor-specific
  assignedFloor?: number;

  // Staff-specific
  designation?: string;
}

/**
 * User Filter Options
 */
export interface UserFilterOptions {
  role?: UserRole;
  accountStatus?: AccountStatus;
  department?: string;
  year?: number;
  program?: Program;
  assignedFloor?: number;
  search?: string; // Search by name, email, universityId
}

/**
 * Pagination Options
 */
export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Bulk User Create Input
 */
export interface BulkCreateUsersInput {
  users: CreateUserInput[];
}
