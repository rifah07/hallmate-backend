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
