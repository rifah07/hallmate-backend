import { z } from 'zod';
import { RoomType, RoomStatus } from '@prisma/client';

// ============================================================================
// ROOM VALIDATION SCHEMAS
// ============================================================================

export const createRoomValidation = z.object({
 body: z.object({
   roomNumber: z
     .string()
     .min(1, 'Room number is required')
     .max(10, 'Room number must be at most 10 characters')
     .regex(
       /^[A-Z0-9-]+$/,
       'Room number must contain only uppercase letters, numbers, and hyphens',
     ),
   floor: z
     .number()
     .int('Floor must be an integer')
     .min(1, 'Floor must be between 1 and 14')
     .max(14, 'Floor must be between 1 and 14'),
   roomType: z.nativeEnum(RoomType, {
     message: 'Room type must be SINGLE, DOUBLE, TRIPLE, or QUAD',
   }),
   capacity: z
     .number()
     .int('Capacity must be an integer')
     .min(1, 'Capacity must be at least 1')
     .max(4, 'Capacity must be at most 4'),
   status: z.nativeEnum(RoomStatus).optional(),
   hasAC: z.boolean().optional(),
   hasBalcony: z.boolean().optional(),
   hasAttachedBath: z.boolean().optional(),
 }),
});

export const updateRoomValidation = z.object({
 params: z.object({
   roomId: z.string().cuid('Invalid room ID'),
 }),
 body: z.object({
   roomNumber: z
     .string()
     .min(1, 'Room number is required')
     .max(10, 'Room number must be at most 10 characters')
     .regex(
       /^[A-Z0-9-]+$/,
       'Room number must contain only uppercase letters, numbers, and hyphens',
     )
     .optional(),
   floor: z
     .number()
     .int('Floor must be an integer')
     .min(1, 'Floor must be between 1 and 14')
     .max(14, 'Floor must be between 1 and 14')
     .optional(),
   roomType: z
     .nativeEnum(RoomType, {
       message: 'Room type must be SINGLE, DOUBLE, TRIPLE, or QUAD',
     })
     .optional(),
   capacity: z
     .number()
     .int('Capacity must be an integer')
     .min(1, 'Capacity must be at least 1')
     .max(4, 'Capacity must be at most 4')
     .optional(),
   status: z.nativeEnum(RoomStatus).optional(),
   hasAC: z.boolean().optional(),
   hasBalcony: z.boolean().optional(),
   hasAttachedBath: z.boolean().optional(),
 }),
});

export const getRoomByIdValidation = z.object({
 params: z.object({
   roomId: z.string().cuid('Invalid room ID'),
 }),
});

export const deleteRoomValidation = z.object({
 params: z.object({
   roomId: z.string().cuid('Invalid room ID'),
 }),
});

export const getRoomsByFloorValidation = z.object({
 params: z.object({
   floor: z.string().transform((val) => {
     const num = parseInt(val, 10);
     if (isNaN(num) || num < 1 || num > 14) {
       throw new Error('Floor must be between 1 and 14');
     }
     return num;
   }),
 }),
});

export const getRoomsByTypeValidation = z.object({
 params: z.object({
   type: z.nativeEnum(RoomType, {
     message: 'Room type must be SINGLE, DOUBLE, TRIPLE, or QUAD',
   }),
 }),
});

export const getVacantRoomsByFloorValidation = z.object({
 params: z.object({
   floor: z.string().transform((val) => {
     const num = parseInt(val, 10);
     if (isNaN(num) || num < 1 || num > 14) {
       throw new Error('Floor must be between 1 and 14');
     }
     return num;
   }),
 }),
});

export const getAllRoomsValidation = z.object({
 query: z.object({
   page: z
     .string()
     .optional()
     .transform((val) => (val ? parseInt(val, 10) : 1)),
   limit: z
     .string()
     .optional()
     .transform((val) => (val ? parseInt(val, 10) : 20)),
   floor: z
     .string()
     .optional()
     .transform((val) => (val ? parseInt(val, 10) : undefined)),
   roomType: z.nativeEnum(RoomType).optional(),
   status: z.nativeEnum(RoomStatus).optional(),
   hasVacancy: z
     .string()
     .optional()
     .transform((val) => (val === 'true' ? true : val === 'false' ? false : undefined)),
   search: z.string().optional(),
   sortBy: z.string().optional(),
   sortOrder: z.enum(['asc', 'desc']).optional(),
 }),
});

// ============================================================================
// ASSIGNMENT VALIDATION SCHEMAS
// ============================================================================

export const assignStudentValidation = z.object({
 params: z.object({
   roomId: z.string().cuid('Invalid room ID'),
 }),
 body: z.object({
   userId: z.string().cuid('Invalid user ID'),
   bedNumber: z
     .number()
     .int('Bed number must be an integer')
     .min(1, 'Bed number must be at least 1')
     .max(4, 'Bed number must be at most 4'),
   assignedDate: z.string().datetime().optional(),
 }),
});

export const unassignStudentValidation = z.object({
 params: z.object({
   roomId: z.string().cuid('Invalid room ID'),
   userId: z.string().cuid('Invalid user ID'),
 }),
});



// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type CreateRoomInput = z.infer<typeof createRoomValidation>['body'];
export type UpdateRoomInput = z.infer<typeof updateRoomValidation>['body'];
export type AssignStudentInput = z.infer<typeof assignStudentValidation>['body'];
