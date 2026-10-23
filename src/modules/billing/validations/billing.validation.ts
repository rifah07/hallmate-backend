import { z } from 'zod';

const amount = z.number().int('Whole taka only').min(1).max(1_000_000);
const dueDate = z.coerce.date().refine((d) => d > new Date(), 'Due date must be in the future');

export const issueRenewalSchema = z.object({
  year: z.number().int().min(2024).max(2100),
  amount,
  dueDate,
});

export const issueBillSchema = z.object({
  studentId: z.string().uuid(),
  type: z.enum(['FINE', 'OTHER']),
  title: z.string().trim().min(3).max(120),
  period: z.string().trim().min(4).max(20), // e.g. "2026-10" or "lost-key-1"
  amount,
  dueDate,
});

export const recordPaymentSchema = z.object({
  gateway: z.enum(['CASH', 'BANK_TRANSFER']),
  reference: z.string().trim().min(3).max(100), // receipt or bank slip number
});

export const listBillsSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: z.string().max(200).optional(),
  status: z.enum(['UNPAID', 'PAID', 'CANCELLED']).optional(),
  period: z.string().max(20).optional(),
});

export const billIdSchema = z.object({ id: z.string().uuid('Invalid bill ID') });

// What SSLCommerz posts back. Only val_id matters; it is verified with the gateway.
export const gatewayCallbackSchema = z.object({ val_id: z.string().min(1).max(100) });

export type IssueRenewalInput = z.infer<typeof issueRenewalSchema>;
export type IssueBillInput = z.infer<typeof issueBillSchema>;
export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>;
export type ListBillsQuery = z.infer<typeof listBillsSchema>;
