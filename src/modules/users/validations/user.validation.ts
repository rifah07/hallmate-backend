import { z } from 'zod';

/**
 * Zod Validation Schemas for User Module
 */

// Enum validations
const userRoleEnum = z.enum([
  'SUPER_ADMIN',
  'PROVOST',
  'HOUSE_TUTOR',
  'ASSISTANT_WARDEN',
  'OFFICE_STAFF',
  'DINING_STAFF',
  'MAINTENANCE_STAFF',
  'GUARD',
  'STUDENT',
  'PARENT',
] as const);

const accountStatusEnum = z.enum([
  'ACTIVE',
  'SUSPENDED',
  'SEAT_CANCELLED',
  'INACTIVE',
  'GRADUATED',
] as const);

const programEnum = z.enum(['UNDERGRADUATE', 'MASTERS', 'PHD'] as const);

const bloodGroupEnum = z.enum([
  'A_POSITIVE',
  'A_NEGATIVE',
  'B_POSITIVE',
  'B_NEGATIVE',
  'O_POSITIVE',
  'O_NEGATIVE',
  'AB_POSITIVE',
  'AB_NEGATIVE',
] as const);

export const getUserByIdSchema = z.object({
  params: z.object({
    userId: z.string().uuid('Invalid user ID format'),
  }),
});

/**
 * Get all users schema (with filters and pagination)
 */
export const getAllUsersSchema = z.object({
  query: z.object({
    // Filters
    role: userRoleEnum.optional(),
    accountStatus: accountStatusEnum.optional(),
    department: z.string().optional(),
    year: z.coerce.number().int().min(1).max(5).optional(),
    program: programEnum.optional(),
    assignedFloor: z.coerce.number().int().min(1).max(14).optional(),
    search: z.string().optional(),

    // Pagination
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    sortBy: z.string().default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  }),
});

/**
 * Create user schema
 */
export const createUserSchema = z.object({
  body: z
    .object({
      universityId: z
        .string()
        .min(10, 'University ID must be at least 10 characters')
        .max(20, 'University ID must not exceed 20 characters'),
      role: userRoleEnum,
      name: z
        .string()
        .min(2, 'Name must be at least 2 characters')
        .max(100, 'Name must not exceed 100 characters'),
      email: z.string().email('Invalid email format'),
      phone: z.string().regex(/^(\+88)?01[3-9]\d{8}$/, 'Invalid Bangladesh phone number'),

      // Student-specific (optional)
      department: z.string().optional(),
      year: z.number().int().min(1).max(5).optional(),
      program: programEnum.optional(),
      session: z.string().optional(),
      bloodGroup: bloodGroupEnum.optional(),
      nationalId: z.string().optional(),
      medicalConditions: z.string().optional(),
      allergies: z.string().optional(),

      // Provost-specific (optional)
      provostMessage: z.string().optional(),
      tenureStart: z.coerce.date().optional(),
      tenureEnd: z.coerce.date().optional(),

      // House Tutor-specific (optional)
      assignedFloor: z.number().int().min(1).max(14).optional(),

      // Staff-specific (optional)
      designation: z.string().optional(),
      joiningDate: z.coerce.date().optional(),
    })
    .refine(
      (data) => {
        // If role is STUDENT, require student-specific fields
        if (data.role === 'STUDENT') {
          return !!(data.department && data.year && data.program && data.session);
        }
        return true;
      },
      {
        message: 'Students must have department, year, program, and session',
      },
    )
    .refine(
      (data) => {
        // If role is HOUSE_TUTOR, require assignedFloor
        if (data.role === 'HOUSE_TUTOR') {
          return !!data.assignedFloor;
        }
        return true;
      },
      {
        message: 'House tutors must have an assigned floor',
      },
    ),
});

/**
 * Update user schema
 */
export const updateUserSchema = z.object({
  params: z.object({
    userId: z.string().uuid('Invalid user ID format'),
  }),
  body: z.object({
    name: z
      .string()
      .min(2, 'Name must be at least 2 characters')
      .max(100, 'Name must not exceed 100 characters')
      .optional(),
    email: z.string().email('Invalid email format').optional(),
    phone: z
      .string()
      .regex(/^(\+88)?01[3-9]\d{8}$/, 'Invalid Bangladesh phone number')
      .optional(),
    photo: z.string().url('Invalid photo URL').optional(),

    // Student-specific
    department: z.string().optional(),
    year: z.number().int().min(1).max(5).optional(),
    bloodGroup: bloodGroupEnum.optional(),
    medicalConditions: z.string().optional(),
    allergies: z.string().optional(),

    // Provost-specific
    provostMessage: z.string().optional(),

    // House Tutor-specific
    assignedFloor: z.number().int().min(1).max(14).optional(),

    // Staff-specific
    designation: z.string().optional(),
  }),
});

/**
 * Update user role schema
 */
export const updateUserRoleSchema = z.object({
  params: z.object({
    userId: z.string().uuid('Invalid user ID format'),
  }),
  body: z.object({
    role: userRoleEnum,
  }),
});

/**
 * Update account status schema
 */
export const updateAccountStatusSchema = z.object({
  params: z.object({
    userId: z.string().uuid('Invalid user ID format'),
  }),
  body: z.object({
    accountStatus: accountStatusEnum,
  }),
});

/**
 * Delete user schema
 */
export const deleteUserSchema = z.object({
  params: z.object({
    userId: z.string().uuid('Invalid user ID format'),
  }),
});
