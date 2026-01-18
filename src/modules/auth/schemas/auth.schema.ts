import z from 'zod';

export const loginSchema = z.object({
  body: z.object({
    universityId: z
      .string()
      .min(1, 'University ID is required')
      .regex(/d{10}$/, 'University ID must have 10 digits'),
    password: z.string().min(1, 'Password is required'),
  }),
});

export const firstTimeLoginSchema = z
  .object({
    body: z.object({
      universityId: z
        .string()
        .min(1, 'University ID is required')
        .regex(/^\d{10}$/, 'University ID must be 10 digits'),
      oneTimePassword: z.string().min(1, 'OTP is required'),
      newPassword: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[A-Z]/, 'Password must contain at least 1 uppercase letter')
        .regex(/[a-z]/, 'Password must contain at least 1 lowercase letter')
        .regex(/[0-9]/, 'Password must contain at least 1 number')
        .regex(/[@$!%*?&]/, 'Password must contain at least 1 special character'),
      confirmPassword: z.string().min(1, 'Confirm password is required'),
    }),
  })
  .refine((data) => data.body.newPassword === data.body.confirmPassword, {
    message: 'Password do not match',
    path: ['body', 'confirmPassword'],
  });
