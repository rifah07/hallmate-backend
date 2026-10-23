import { z } from 'zod';

export const requestVisitSchema = z.object({
  name: z.string().trim().min(2).max(100),
  phone: z.string().regex(/^01[3-9]\d{8}$/, 'Enter a Bangladeshi mobile number'),
  relation: z.string().trim().min(2).max(50),
  purpose: z.string().trim().min(3).max(300),
  visitDate: z.coerce.date(), // range checked in the service against Dhaka's today
});

export const decideVisitSchema = z.object({
  approve: z.boolean(),
  note: z.string().trim().max(300).optional(),
});

export const listVisitsSchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursor: z.string().max(200).optional(),
});

export const visitIdSchema = z.object({ id: z.string().uuid('Invalid visit ID') });

export type RequestVisitInput = z.infer<typeof requestVisitSchema>;
export type DecideVisitInput = z.infer<typeof decideVisitSchema>;
export type ListVisitsQuery = z.infer<typeof listVisitsSchema>;
