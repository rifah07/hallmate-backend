import z from "zod";

export const loginSchema = z.object({
    body: z.object({
        universityId: z
            .string()
            .min(1, 'University ID is required')
            .regex(/d{10}$/, 'University ID must have 10 digits'),
        password: z.string().min(1, 'Password is required'),        
    }),
});
