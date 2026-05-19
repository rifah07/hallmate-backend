import { z } from 'zod';

// ─────────────────────────────────────────────
// Shared field definitions — defined once, reused
// ─────────────────────────────────────────────

const slugField = z
  .string()
  .min(2)
  .max(100)
  .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers and hyphens only')
  .trim();
const sortOrderField = z
  .union([z.number().int().min(0), z.string().transform((v) => parseInt(v, 10))])
  .optional();
const isActiveField = z.union([z.boolean(), z.string().transform((v) => v === 'true')]).optional();
const isPublishedField = z
  .union([z.boolean(), z.string().transform((v) => v === 'true')])
  .optional();
const isFeaturedField = z
  .union([z.boolean(), z.string().transform((v) => v === 'true')])
  .optional();
const tagsField = z
  .union([
    z.array(z.string()),
    z.string().transform((v) =>
      v
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    ),
  ])
  .optional()
  .default([]);

// ─────────────────────────────────────────────
// Hall Info
// ─────────────────────────────────────────────

export const hallInfoSchema = z.object({
  name: z.string().min(2).max(200).trim(),
  established: z.union([z.number().int(), z.string().transform((v) => parseInt(v, 10))]),
  location: z.string().min(2).max(300).trim(),
  description: z.string().min(10).trim(),
  vision: z.string().trim().optional(),
  mission: z.string().trim().optional(),
  capacity: z.union([z.number().int().min(1), z.string().transform((v) => parseInt(v, 10))]),
  totalRooms: z.union([z.number().int().min(1), z.string().transform((v) => parseInt(v, 10))]),
  mapEmbedUrl: z.string().url().optional(),
  email: z.string().email().optional(),
  phone: z.string().max(20).optional(),
  address: z.string().max(500).trim().optional(),
  socialLinks: z
    .string()
    .transform((v) => JSON.parse(v))
    .optional(), // JSON string from form
  isActive: isActiveField,
});

// ─────────────────────────────────────────────
// Facility
// ─────────────────────────────────────────────

export const facilitySchema = z.object({
  name: z.string().min(2).max(150).trim(),
  slug: slugField,
  category: z.enum([
    'ACCOMMODATION',
    'DINING',
    'SPORTS',
    'ACADEMIC',
    'HEALTH',
    'RECREATION',
    'UTILITIES',
  ]),
  description: z.string().min(10).trim(),
  isActive: isActiveField,
  sortOrder: sortOrderField,
});

// ─────────────────────────────────────────────
// FAQ
// ─────────────────────────────────────────────

export const faqSchema = z.object({
  question: z.string().min(5).max(500).trim(),
  answer: z.string().min(10).trim(),
  category: z.string().max(50).trim().optional().default('GENERAL'),
  isActive: isActiveField,
  sortOrder: sortOrderField,
});

// ─────────────────────────────────────────────
// Dining Info
// ─────────────────────────────────────────────

export const diningInfoSchema = z.object({
  mealPlan: z.string().transform((v) => JSON.parse(v)), // JSON string from form
  weeklyMenu: z
    .string()
    .transform((v) => JSON.parse(v))
    .optional(),
  specialDiets: z
    .union([
      z.array(z.string()),
      z.string().transform((v) =>
        v
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      ),
    ])
    .optional()
    .default([]),
  capacity: z
    .union([z.number().int().min(1), z.string().transform((v) => parseInt(v, 10))])
    .optional(),
  location: z.string().max(200).trim().optional(),
  contactPhone: z.string().max(20).optional(),
  notice: z.string().max(1000).trim().optional(),
  isActive: isActiveField,
});

// ─────────────────────────────────────────────
// Achievement
// ─────────────────────────────────────────────

export const achievementSchema = z.object({
  title: z.string().min(2).max(300).trim(),
  description: z.string().min(10).trim(),
  category: z.string().max(50).trim().optional().default('GENERAL'),
  year: z.union([
    z
      .number()
      .int()
      .min(1900)
      .max(new Date().getFullYear() + 1),
    z.string().transform((v) => parseInt(v, 10)),
  ]),
  isActive: isActiveField,
  isFeatured: isFeaturedField,
  sortOrder: sortOrderField,
});

// ─────────────────────────────────────────────
// Public Notice
// ─────────────────────────────────────────────

export const noticeSchema = z.object({
  title: z.string().min(2).max(300).trim(),
  slug: slugField,
  content: z.string().min(10).trim(),
  summary: z.string().max(500).trim().optional(),
  pdfUrl: z.string().url().optional(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).optional().default('NORMAL'),
  category: z.string().max(50).trim().optional().default('GENERAL'),
  tags: tagsField,
  isPublished: isPublishedField,
  publishedAt: z
    .string()
    .refine((v) => !isNaN(Date.parse(v)), 'Invalid date')
    .transform((v) => new Date(v))
    .optional(),
  expiresAt: z
    .string()
    .refine((v) => !isNaN(Date.parse(v)), 'Invalid date')
    .transform((v) => new Date(v))
    .optional(),
});

// ─────────────────────────────────────────────
// Public Event
// ─────────────────────────────────────────────

export const eventSchema = z.object({
  title: z.string().min(2).max(300).trim(),
  slug: slugField,
  description: z.string().min(10).trim(),
  summary: z.string().max(500).trim().optional(),
  venue: z.string().max(200).trim().optional(),
  startDate: z
    .string()
    .refine((v) => !isNaN(Date.parse(v)), 'Invalid date')
    .transform((v) => new Date(v)),
  endDate: z
    .string()
    .refine((v) => !isNaN(Date.parse(v)), 'Invalid date')
    .transform((v) => new Date(v))
    .optional(),
  isAllDay: z
    .union([z.boolean(), z.string().transform((v) => v === 'true')])
    .optional()
    .default(false),
  tags: tagsField,
  isPublished: isPublishedField,
  isFeatured: isFeaturedField,
});

// ─────────────────────────────────────────────
// Gallery Item
// ─────────────────────────────────────────────

export const galleryItemSchema = z.object({
  title: z.string().min(2).max(200).trim(),
  description: z.string().max(500).trim().optional(),
  category: z
    .enum(['INFRASTRUCTURE', 'EVENTS', 'SPORTS', 'CULTURAL', 'ACADEMICS', 'DINING', 'GENERAL'])
    .optional()
    .default('GENERAL'),
  tags: tagsField,
  isActive: isActiveField,
  sortOrder: sortOrderField,
  capturedAt: z
    .string()
    .refine((v) => !isNaN(Date.parse(v)), 'Invalid date')
    .transform((v) => new Date(v))
    .optional(),
});

// ─────────────────────────────────────────────
// House Tutor Profile
// ─────────────────────────────────────────────

export const houseTutorSchema = z.object({
  name: z.string().min(2).max(100).trim(),
  designation: z.string().max(100).trim().optional().default('House Tutor'),
  department: z.string().max(150).trim(),
  floor: z
    .union([z.number().int().min(1), z.string().transform((v) => parseInt(v, 10))])
    .optional(),
  wing: z.string().max(5).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(20).optional(),
  bio: z.string().max(2000).trim().optional(),
  officeHours: z.string().max(200).trim().optional(),
  isActive: isActiveField,
  sortOrder: sortOrderField,
});

// ─────────────────────────────────────────────
// Staff Profile
// ─────────────────────────────────────────────

export const staffProfileSchema = z.object({
  name: z.string().min(2).max(100).trim(),
  designation: z.string().min(2).max(150).trim(),
  category: z.enum(['ADMINISTRATIVE', 'ACADEMIC', 'SUPPORT', 'SECURITY', 'DINING', 'MAINTENANCE']),
  department: z.string().max(150).trim().optional(),
  email: z.string().email().optional(),
  phone: z.string().max(20).optional(),
  bio: z.string().max(2000).trim().optional(),
  qualifications: z.string().max(1000).trim().optional(),
  joiningDate: z
    .string()
    .refine((v) => !isNaN(Date.parse(v)), 'Invalid date')
    .transform((v) => new Date(v))
    .optional(),
  isPublic: z
    .union([z.boolean(), z.string().transform((v) => v === 'true')])
    .optional()
    .default(true),
  sortOrder: sortOrderField,
});

// ─────────────────────────────────────────────
// Admission Info
// ─────────────────────────────────────────────

export const admissionInfoSchema = z.object({
  session: z.string().min(2).max(20).trim(),
  eligibility: z.string().min(10).trim(),
  process: z.string().min(10).trim(),
  requiredDocs: z
    .union([
      z.array(z.string()),
      z.string().transform((v) =>
        v
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
      ),
    ])
    .optional()
    .default([]),
  importantDates: z
    .string()
    .transform((v) => JSON.parse(v))
    .optional(),
  seatCapacity: z
    .union([z.number().int().min(1), z.string().transform((v) => parseInt(v, 10))])
    .optional(),
  applicationFee: z
    .union([z.number().min(0), z.string().transform((v) => parseFloat(v))])
    .optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().max(20).optional(),
  faqItems: z
    .string()
    .transform((v) => JSON.parse(v))
    .optional(),
  isActive: isActiveField,
  isCurrent: z.union([z.boolean(), z.string().transform((v) => v === 'true')]).optional(),
});

// ─────────────────────────────────────────────
// Page Content (about, admission overview etc.)
// ─────────────────────────────────────────────

export const pageContentSchema = z.object({
  page: z.string().min(2).max(50).trim(),
  content: z.string().transform((v) => JSON.parse(v)), // JSON string
  isActive: isActiveField,
});

// ─────────────────────────────────────────────
// UUID param (reused across all delete/update routes)
// ─────────────────────────────────────────────

export const idParamSchema = z.object({
  id: z.string().uuid({ message: 'Invalid ID format' }),
});

export type HallInfoBody = z.infer<typeof hallInfoSchema>;
export type FacilityBody = z.infer<typeof facilitySchema>;
export type FAQBody = z.infer<typeof faqSchema>;
export type DiningInfoBody = z.infer<typeof diningInfoSchema>;
export type AchievementBody = z.infer<typeof achievementSchema>;
export type NoticeBody = z.infer<typeof noticeSchema>;
export type EventBody = z.infer<typeof eventSchema>;
export type GalleryItemBody = z.infer<typeof galleryItemSchema>;
export type HouseTutorBody = z.infer<typeof houseTutorSchema>;
export type StaffProfileBody = z.infer<typeof staffProfileSchema>;
export type AdmissionInfoBody = z.infer<typeof admissionInfoSchema>;
export type PageContentBody = z.infer<typeof pageContentSchema>;
