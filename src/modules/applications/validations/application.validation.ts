import { z } from 'zod';

const emergencyContactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().regex(/^01[0-9]{9}$/, 'Invalid phone number'),
  relation: z.string().min(2, 'Relation must be specified'),
});

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

const seatSwapDataSchema = z.object({
  currentRoomId: z.string().uuid('Invalid room ID'),
  targetStudentId: z.string().uuid('Invalid student ID'),
  targetRoomId: z.string().uuid('Invalid room ID'),
  reason: z.string().min(10, 'Reason must be at least 10 characters'),
  targetStudentConsent: z.boolean(),
});

const leaveApplicationDataSchema = z.object({
  leaveType: z.enum(['SHORT_LEAVE', 'LONG_LEAVE', 'OVERNIGHT', 'MEDICAL', 'EMERGENCY']),
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()),
  destination: z.string().min(3, 'Destination must be specified'),
  reason: z.string().min(10, 'Reason must be at least 10 characters'),
  emergencyContact: emergencyContactSchema,
  guardianConsent: z.boolean().optional(),
});

const complaintApplicationDataSchema = z.object({
  category: z.enum([
    'ELECTRICAL',
    'PLUMBING',
    'FURNITURE',
    'CLEANLINESS',
    'MESS_FOOD',
    'NOISE',
    'SECURITY',
    'HARASSMENT',
    'OTHER',
  ]),
  priority: z.enum(['LOW', 'NORMAL', 'URGENT', 'EMERGENCY']),
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  location: z.string().optional(),
  roomId: z.string().uuid('Invalid room ID').optional(),
});

const maintenanceApplicationDataSchema = z.object({
  category: z.string().min(3, 'Category must be specified'),
  priority: z.enum(['LOW', 'NORMAL', 'URGENT', 'EMERGENCY']),
  roomId: z.string().uuid('Invalid room ID').optional(),
  location: z.string().min(3, 'Location must be specified'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  preferredDate: z.string().or(z.date()).optional(),
});

// ============================================================================
// CREATE APPLICATION (FINAL - DISCRIMINATED UNION)
// ============================================================================

export const createApplicationSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('SEAT_APPLICATION'),
    data: seatApplicationDataSchema,
    attachments: z.array(z.string().url()).optional(),
  }),

  z.object({
    type: z.literal('SEAT_CANCELLATION'),
    data: seatCancellationDataSchema,
    attachments: z.array(z.string().url()).optional(),
  }),

  z.object({
    type: z.literal('SEAT_TRANSFER'),
    data: seatTransferDataSchema,
    attachments: z.array(z.string().url()).optional(),
  }),

  z.object({
    type: z.literal('SEAT_SWAP'),
    data: seatSwapDataSchema,
    attachments: z.array(z.string().url()).optional(),
  }),

  z.object({
    type: z.literal('LEAVE'),
    data: leaveApplicationDataSchema,
    attachments: z.array(z.string().url()).optional(),
  }),

  z.object({
    type: z.literal('COMPLAINT'),
    data: complaintApplicationDataSchema,
    attachments: z.array(z.string().url()).optional(),
  }),

  z.object({
    type: z.literal('MAINTENANCE'),
    data: maintenanceApplicationDataSchema,
    attachments: z.array(z.string().url()).optional(),
  }),
]);

export const updateApplicationSchema = z.object({
  data: z.record(z.string(), z.any()).optional(),
  attachments: z.array(z.string().url()).optional(),
});

export const assignApplicationSchema = z.object({
  assignedTo: z.string().uuid('Invalid user ID'),
  assignedToRole: z.enum([
    'SUPER_ADMIN',
    'PROVOST',
    'HOUSE_TUTOR',
    'ASSISTANT_WARDEN',
    'OFFICE_STAFF',
    'DINING_STAFF',
    'MAINTENANCE_STAFF',
  ]),
});

export const respondToApplicationSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED', 'CANCELLED']),
  responseNote: z.string().min(10, 'Response note must be at least 10 characters'),
});

// ============================================================================
// QUERY PARAMS VALIDATION
// ============================================================================

export const applicationQuerySchema = z.object({
  type: z
    .enum([
      'SEAT_APPLICATION',
      'SEAT_CANCELLATION',
      'SEAT_TRANSFER',
      'SEAT_SWAP',
      'LEAVE',
      'COMPLAINT',
      'MAINTENANCE',
    ])
    .optional(),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED']).optional(),
  studentId: z.string().uuid('Invalid student ID').optional(),
  assignedTo: z.string().uuid('Invalid user ID').optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export const applicationIdSchema = z.object({
  applicationId: z.string().uuid('Invalid application ID'),
});
