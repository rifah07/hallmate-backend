import { z } from 'zod';

const positiveInt = (defaultVal: number) =>
  z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : defaultVal))
    .refine((v) => Number.isInteger(v) && v > 0, { message: 'Must be a positive integer' });

export const paginationSchema = z.object({
  page: positiveInt(1),
  limit: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : 10))
    .refine((v) => Number.isInteger(v) && v > 0 && v <= 100, {
      message: 'Limit must be between 1 and 100',
    }),
});

// ─────────────────────────────────────────────
// Gallery
// ─────────────────────────────────────────────

export const galleryQuerySchema = paginationSchema.extend({
  category: z
    .enum(['INFRASTRUCTURE', 'EVENTS', 'SPORTS', 'CULTURAL', 'ACADEMICS', 'DINING', 'GENERAL'])
    .optional(),
  search: z.string().max(100).optional(),
});

// ─────────────────────────────────────────────
// Notices
// ─────────────────────────────────────────────

export const noticeListQuerySchema = paginationSchema.extend({
  category: z.string().max(50).optional(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).optional(),
  search: z.string().max(100).optional(),
});

export const noticeIdParamSchema = z.object({
  noticeId: z.string().uuid({ message: 'Invalid notice ID format' }),
});

// ─────────────────────────────────────────────
// Events
// ─────────────────────────────────────────────

export const eventQuerySchema = paginationSchema.extend({
  search: z.string().max(100).optional(),
  upcoming: z
    .string()
    .optional()
    .transform((v) => v === 'true'),
  featured: z
    .string()
    .optional()
    .transform((v) => v === 'true'),
});

// ─────────────────────────────────────────────
// Achievements
// ─────────────────────────────────────────────

export const achievementQuerySchema = paginationSchema.extend({
  category: z.string().max(50).optional(),
  year: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : undefined))
    .refine(
      (v) => v === undefined || (Number.isInteger(v) && v > 1900 && v <= new Date().getFullYear()),
      {
        message: 'Invalid year',
      },
    ),
});

// ─────────────────────────────────────────────
// Staff
// ─────────────────────────────────────────────

export const staffQuerySchema = paginationSchema.extend({
  category: z
    .enum(['ADMINISTRATIVE', 'ACADEMIC', 'SUPPORT', 'SECURITY', 'DINING', 'MAINTENANCE'])
    .optional(),
  search: z.string().max(100).optional(),
});

// ─────────────────────────────────────────────
// FAQ
// ─────────────────────────────────────────────

export const faqQuerySchema = z.object({
  category: z.string().max(50).optional(),
  search: z.string().max(100).optional(),
});

// ─────────────────────────────────────────────
// Facilities
// ─────────────────────────────────────────────

export const facilityQuerySchema = z.object({
  category: z
    .enum(['ACCOMMODATION', 'DINING', 'SPORTS', 'ACADEMIC', 'HEALTH', 'RECREATION', 'UTILITIES'])
    .optional(),
});

// ─────────────────────────────────────────────
// Contact Form
// ─────────────────────────────────────────────

export const contactBodySchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must not exceed 100 characters')
    .trim(),
  email: z
    .string()
    .email('Invalid email address')
    .max(255, 'Email must not exceed 255 characters')
    .toLowerCase(),
  phone: z
    .string()
    .regex(/^(\+880|0)[1-9]\d{8,9}$/, 'Invalid Bangladeshi phone number')
    .optional(),
  subject: z
    .string()
    .min(5, 'Subject must be at least 5 characters')
    .max(200, 'Subject must not exceed 200 characters')
    .trim(),
  message: z
    .string()
    .min(20, 'Message must be at least 20 characters')
    .max(2000, 'Message must not exceed 2000 characters')
    .trim(),
});

export type ContactBody = z.infer<typeof contactBodySchema>;

// ─────────────────────────────────────────────
// Public Application
// ─────────────────────────────────────────────

export const publicApplicationBodySchema = z.object({
  type: z.enum(['SEAT_REQUEST', 'INFORMATION_REQUEST', 'GENERAL_INQUIRY', 'ADMISSION_QUERY']),
  applicantName: z.string().min(2, 'Name must be at least 2 characters').max(100).trim(),
  applicantEmail: z.string().email('Invalid email address').max(255).toLowerCase(),
  applicantPhone: z.string().regex(/^(\+880|0)[1-9]\d{8,9}$/, 'Invalid Bangladeshi phone number'),
  studentId: z.string().max(20).optional(),
  program: z.enum(['UNDERGRADUATE', 'MASTERS', 'PHD']).optional(),
  department: z.string().max(100).trim().optional(),
  session: z
    .string()
    .regex(/^\d{4}-\d{2,4}$/, 'Session format should be YYYY-YY or YYYY-YYYY')
    .optional(),
  subject: z.string().min(5, 'Subject must be at least 5 characters').max(200).trim(),
  message: z.string().min(20, 'Message must be at least 20 characters').max(3000).trim(),
  attachments: z
    .array(z.string().url('Each attachment must be a valid URL'))
    .max(5, 'Maximum 5 attachments allowed')
    .optional()
    .default([]),
});

export type PublicApplicationBody = z.infer<typeof publicApplicationBodySchema>;

// ─────────────────────────────────────────────
// Application Tracking
// ─────────────────────────────────────────────

export const trackApplicationParamSchema = z.object({
  applicationId: z.string().uuid({ message: 'Invalid application ID format' }),
});

// ─────────────────────────────────────────────
// Provost History (admin create/update — used
// by the admin module but defined here to keep
// all public-facing schemas in one place)
// ─────────────────────────────────────────────

export const provostHistoryBodySchema = z.object({
  name: z.string().min(2).max(100).trim(),
  designation: z.string().max(100).trim().optional(),
  department: z.string().max(150).trim().optional(),
  tenureStart: z
    .string()
    .refine((v) => !isNaN(Date.parse(v)), { message: 'tenureStart must be a valid date' })
    .transform((v) => new Date(v)),
  tenureEnd: z
    .string()
    .refine((v) => !isNaN(Date.parse(v)), { message: 'tenureEnd must be a valid date' })
    .transform((v) => new Date(v))
    .optional(),
  isCurrent: z.union([z.boolean(), z.string().transform((v) => v === 'true')]).optional(),
  bio: z.string().max(2000).trim().optional(),
  sortOrder: z.union([z.number().int(), z.string().transform((v) => parseInt(v, 10))]).optional(),
  // Links this history record to a User account.
  // SUPER_ADMIN provides this when creating the current provost's record
  // so the self-edit guard can identify and block the provost from editing it.
  userId: z.string().uuid({ message: 'userId must be a valid UUID' }).optional().nullable(),
});

export type ProvostHistoryBody = z.infer<typeof provostHistoryBodySchema>;
