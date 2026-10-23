import { z } from 'zod';

export const verifyCardSchema = z.object({ token: z.string().min(20).max(1000) });
