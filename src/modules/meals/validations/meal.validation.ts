import { z } from 'zod';

export const updateMealSchema = z
  .object({
    breakfast: z.boolean().optional(),
    lunch: z.boolean().optional(),
    dinner: z.boolean().optional(),
  })
  .refine(
    (data) => {
      // At least one meal type must be provided
      return data.breakfast !== undefined || data.lunch !== undefined || data.dinner !== undefined;
    },
    {
      message: 'At least one meal type (breakfast, lunch, or dinner) must be provided',
    },
  );

export const bulkUpdateMealSchema = z
  .object({
    studentIds: z
      .array(z.string().uuid('Invalid student ID'))
      .min(1, 'At least one student ID required'),
    date: z.string().or(z.date()),
    breakfast: z.boolean().optional(),
    lunch: z.boolean().optional(),
    dinner: z.boolean().optional(),
  })
  .refine(
    (data) => {
      return data.breakfast !== undefined || data.lunch !== undefined || data.dinner !== undefined;
    },
    {
      message: 'At least one meal type must be provided',
    },
  );

export const mealQuerySchema = z.object({
  studentId: z.string().uuid('Invalid student ID').optional(),
  date: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  breakfast: z.string().optional(),
  lunch: z.string().optional(),
  dinner: z.string().optional(),
  floor: z.string().optional(),
  roomNumber: z.string().optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export const mealDateSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format. Use YYYY-MM-DD'),
});

export const studentIdSchema = z.object({
  studentId: z.string().uuid('Invalid student ID'),
});

export const monthYearSchema = z.object({
  month: z.string().regex(/^(0?[1-9]|1[0-2])$/, 'Month must be 1-12'),
  year: z.string().regex(/^\d{4}$/, 'Year must be 4 digits'),
});
