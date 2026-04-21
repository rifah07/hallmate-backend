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
