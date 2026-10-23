import { z } from 'zod';

export const listNotificationsSchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursor: z.string().max(200).optional(),
});

export const notificationIdSchema = z.object({
  id: z.string().uuid('Invalid notification ID'),
});

export type ListNotificationsQuery = z.infer<typeof listNotificationsSchema>;
