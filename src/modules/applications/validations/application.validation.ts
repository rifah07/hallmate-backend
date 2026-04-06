import { z } from 'zod';

// ============================================================================
// COMMON SCHEMAS
// ============================================================================

const emergencyContactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().regex(/^01[0-9]{9}$/, 'Invalid phone number'),
  relation: z.string().min(2, 'Relation must be specified'),
});

// ============================================================================
// APPLICATION DATA SCHEMAS (by type)
// ============================================================================

const seatApplicationDataSchema = z.object({
  roomPreference: z.string().optional(),
  reason: z.string().min(10, 'Reason must be at least 10 characters'),
  emergencyContact: emergencyContactSchema.optional(),
});

const seatCancellationDataSchema = z.object({
  reason: z.string().min(10, 'Reason must be at least 10 characters'),
  effectiveDate: z.string().or(z.date()),
  forwardingAddress: z.string().optional(),
});

const seatTransferDataSchema = z.object({
  currentRoomId: z.string().uuid('Invalid room ID'),
  targetRoomId: z.string().uuid('Invalid room ID').optional(),
  targetRoomType: z.enum(['SINGLE', 'DOUBLE', 'TRIPLE', 'FOUR_SHARING']).optional(),
  reason: z.string().min(10, 'Reason must be at least 10 characters'),
});