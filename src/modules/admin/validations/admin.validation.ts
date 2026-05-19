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
