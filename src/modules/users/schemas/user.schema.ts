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
