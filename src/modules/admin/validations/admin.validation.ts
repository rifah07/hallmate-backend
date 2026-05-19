import { z } from 'zod';

// ─────────────────────────────────────────────
// Shared field definitions - defined once, reused
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
// UUID param (reused across all delete/update routes)
// ─────────────────────────────────────────────

export const idParamSchema = z.object({
  id: z.string().uuid({ message: 'Invalid ID format' }),
});

export type HallInfoBody = z.infer<typeof hallInfoSchema>;
export type FacilityBody = z.infer<typeof facilitySchema>;
export type FAQBody = z.infer<typeof faqSchema>;
