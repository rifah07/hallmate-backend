import { TOP_FLOOR } from '@/shared/constants/hall.constants';
import { z } from 'zod';

// Bodies arrive as multipart/form-data (optional PDF), so numbers and dates
// come in as strings and are coerced.
const noticeFields = {
  title: z.string().trim().min(3).max(200),
  content: z.string().trim().min(1).max(10000),
  audience: z.enum(['ALL', 'FLOOR']).default('ALL'),
  targetFloor: z.coerce.number().int().min(1).max(TOP_FLOOR).optional(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).default('NORMAL'),
  expiresAt: z.coerce.date().optional(),
};

const floorMatchesAudience = (b: { audience?: string; targetFloor?: number }) =>
  b.audience !== 'FLOOR' || b.targetFloor !== undefined;
const floorRule = { message: 'targetFloor is required for a floor notice', path: ['targetFloor'] };

export const createNoticeSchema = z.object(noticeFields).refine(floorMatchesAudience, floorRule);

export const updateNoticeSchema = z
  .object(noticeFields)
  .partial()
  .refine((b) => Object.keys(b).length > 0, 'Nothing to update')
  .refine(floorMatchesAudience, floorRule);

export const listNoticesSchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursor: z.string().max(200).optional(),
});

export const noticeIdSchema = z.object({ id: z.string().uuid('Invalid notice ID') });

export type CreateNoticeInput = z.infer<typeof createNoticeSchema>;
export type UpdateNoticeInput = z.infer<typeof updateNoticeSchema>;
export type ListNoticesQuery = z.infer<typeof listNoticesSchema>;
