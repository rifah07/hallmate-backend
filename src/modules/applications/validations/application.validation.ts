import { z } from 'zod';

// ============================================================================
// COMMON SCHEMAS
// ============================================================================

const emergencyContactSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  phone: z.string().regex(/^01[0-9]{9}$/, { message: 'Invalid phone number' }),
  relation: z.string().min(2, { message: 'Relation must be specified' }),
});