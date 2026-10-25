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

// A student knows her friend's university ID, not internal IDs: either form
// works, and the service fills in the rest from the university ID
const seatSwapDataSchema = z.object({
  currentRoomId: z.string().uuid('Invalid room ID').optional(),
  targetStudentId: z.string().uuid('Invalid student ID').optional(),
  targetRoomId: z.string().uuid('Invalid room ID').optional(),
  targetUniversityId: z
    .string()
    .regex(/^\d{10}$/, 'University ID must be 10 digits')
    .optional(),
  reason: z.string().min(10, 'Reason must be at least 10 characters'),
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

export type SeatCancellationData = z.infer<typeof seatCancellationDataSchema>;
export type SeatTransferData = z.infer<typeof seatTransferDataSchema>;
export type SeatSwapData = z.infer<typeof seatSwapDataSchema>;
export type LeaveApplicationData = z.infer<typeof leaveApplicationDataSchema>;
export type ComplaintData = z.infer<typeof complaintApplicationDataSchema>;
export type MaintenanceData = z.infer<typeof maintenanceApplicationDataSchema>;

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

export const updateApplicationSchema = z
  .object({
    data: z.record(z.string(), z.any()).optional(),
    attachments: z.array(z.string().url()).optional(),
  })
  .refine((val) => val.data !== undefined || val.attachments !== undefined, {
    message: 'At least one of data or attachments must be provided',
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
  // Required when approving a seat application or a transfer: where she goes
  allocation: z
    .object({
      roomId: z.string().uuid('Invalid room ID'),
      bedNumber: z.number().int().min(1).max(4),
    })
    .optional(),
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
