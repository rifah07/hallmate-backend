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

const bdPhoneRegex = /^(\+88)?01[3-9]\d{8}$/;

export const getUserByIdValidation = z.object({
  params: z.object({
    userId: z.string().uuid('Invalid user ID format'),
  }),
  query: z.object({}).optional(),
  body: z.object({}).optional(),
});

export const getUserByUniversityIdValidation = z.object({
  params: z.object({
    universityId: z.string().min(1, 'University ID is required'),
  }),
  query: z.object({}).optional(),
  body: z.object({}).optional(),
});

/**
 * Get all users schema (with filters and pagination)
 */
export const getAllUsersValidation = z.object({
  params: z.object({}).optional(),
  query: z.object({
    page: z.string().regex(/^\d+$/).optional().default('1'),
    limit: z
      .string()
      .regex(/^\d+$/)
      .optional()
      .default('20')
      .transform(Number)
      .pipe(z.number().min(1).max(100)),
    role: userRoleEnum.optional(),
    accountStatus: accountStatusEnum.optional(),
    department: z.string().optional(),
    year: z
      .string()
      .regex(/^[1-9]\d*$/)
      .optional(),
    program: programEnum.optional(),
    floor: z
      .string()
      .regex(/^([1-9]|1[0-4])$/)
      .optional(),
    search: z.string().optional(),
  }),
  body: z.object({}).optional(),
});

/**
 * Create user schema
 */
export const createUserValidation = z.object({
  params: z.object({}).optional(),
  query: z.object({}).optional(),
  body: z
    .object({
      universityId: z.string().regex(/^\d{10}$/, 'University ID must be exactly 10 digits'),
      role: userRoleEnum,
      name: z
        .string()
        .min(2, 'Name must be at least 2 characters')
        .max(100, 'Name must not exceed 100 characters'),
      email: z.string().email('Invalid email format'),
      phone: z.string().regex(bdPhoneRegex, 'Invalid Bangladeshi phone number'),

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
        path: ['role'],
      },
    )
    .refine(
      (data) => {
        // If role is HOUSE_TUTOR, require assignedFloor
        if (data.role === 'HOUSE_TUTOR') {
          return data.assignedFloor !== undefined;
        }
        return true;
      },
      {
        message: 'House tutors must have an assigned floor',
        path: ['assignedFloor'],
      },
    ),
});

/**
 * Update user schema
 */
export const updateUserValidation = z.object({
  params: z.object({
    userId: z.string().uuid('Invalid user ID format'),
  }),
  query: z.object({}).optional(),
  body: z
    .object({
      name: z
        .string()
        .min(2, 'Name must be at least 2 characters')
        .max(100, 'Name must not exceed 100 characters')
        .optional(),
      email: z.string().email('Invalid email format').optional(),
      phone: z.string().regex(bdPhoneRegex, 'Invalid Bangladeshi phone number').optional(),
      bloodGroup: bloodGroupEnum.optional(),
      photo: z.string().url('Invalid photo URL').optional(),

      // Student-specific
      department: z.string().optional(),
      year: z.number().int().min(1).max(5).optional(),
      program: programEnum.optional(),
      session: z.string().optional(),
      medicalConditions: z.string().optional(),
      allergies: z.string().optional(),

      // Provost-specific
      provostMessage: z.string().optional(),

      // House Tutor-specific
      assignedFloor: z.number().int().min(1).max(14).optional(),

      // Staff-specific
      designation: z.string().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: 'At least one field must be provided for update',
    }),
});

/**
 * Update user role schema
 */
export const updateUserRoleValidation = z.object({
  params: z.object({
    userId: z.string().uuid('Invalid user ID format'),
  }),
  query: z.object({}).optional(),
  body: z.object({
    role: userRoleEnum,
  }),
});

/**
 * Update account status schema
 */
export const updateAccountStatusValidation = z.object({
  params: z.object({
    userId: z.string().uuid('Invalid user ID format'),
  }),
  query: z.object({}).optional(),
  body: z.object({
    accountStatus: accountStatusEnum,
  }),
});

/**
 * Delete user schema
 */
export const deleteUserValidation = z.object({
  params: z.object({
    userId: z.string().uuid('Invalid user ID format'),
  }),
  query: z.object({}).optional(),
  body: z.object({}).optional(),
});

export const restoreUserValidation = z.object({
  params: z.object({
    userId: z.string().uuid('Invalid user ID format'),
  }),
  query: z.object({}).optional(),
  body: z.object({}).optional(),
});

/**
 * Search users schema
 */
export const searchUsersValidation = z.object({
  params: z.object({}).optional(),
  query: z.object({
    q: z.string().min(1, 'Search query is required'),
    page: z.string().regex(/^\d+$/).optional().default('1'),
    limit: z.string().regex(/^\d+$/).optional().default('20'),
  }),
});

/**
 * Get users by role schema
 */
export const getUsersByRoleValidation = z.object({
  params: z.object({
    role: userRoleEnum,
  }),
  query: z.object({
    page: z.string().regex(/^\d+$/).optional().default('1'),
    limit: z.string().regex(/^\d+$/).optional().default('20'),
  }),
  body: z.object({}).optional(),
});

/**
 * Get users by floor schema
 */
export const getUsersByFloorValidation = z.object({
  params: z.object({
    floor: z.string().regex(/^([1-9]|1[0-4])$/, 'Floor must be between 1 and 14'),
  }),
  query: z.object({}).optional(),
  body: z.object({}).optional(),
});

/**
 * Bulk create users schema
 */
export const bulkCreateUsersValidation = z.object({
  params: z.object({}).optional(),
  query: z.object({}).optional(),
  body: z.object({
    users: z
      .array(
        z.object({
          universityId: z.string().regex(/^\d{10}$/, 'University ID must be exactly 10 digits'),
          role: userRoleEnum,
          name: z.string().min(2).max(100),
          email: z.string().email(),
          phone: z.string().regex(bdPhoneRegex).optional(),

          // Optional fields
          department: z.string().optional(),
          year: z.number().int().min(1).max(5).optional(),
          program: programEnum.optional(),
          session: z.string().optional(),
          bloodGroup: bloodGroupEnum.optional(),
          nationalId: z.string().optional(),
          medicalConditions: z.string().optional(),
          allergies: z.string().optional(),
          provostMessage: z.string().optional(),
          tenureStart: z.coerce.date().optional(),
          tenureEnd: z.coerce.date().optional(),
          assignedFloor: z.number().int().min(1).max(14).optional(),
          designation: z.string().optional(),
          joiningDate: z.coerce.date().optional(),
        }),
      )
      .min(1, 'At least one user is required')
      .max(100, 'Cannot create more than 100 users at once'),
  }),
});

/**
 * Upload profile picture schema
 */
export const uploadProfilePictureValidation = z.object({
  params: z.object({
    userId: z.string().uuid('Invalid user ID format'),
  }),
  query: z.object({}).optional(),
  body: z.object({}).optional(),
});

/**
 * Delete profile picture schema
 */
export const deleteProfilePictureValidation = z.object({
  params: z.object({
    userId: z.string().uuid('Invalid user ID format'),
  }),
  query: z.object({}).optional(),
  body: z.object({}).optional(),
});
