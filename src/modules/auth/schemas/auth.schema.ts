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

export const changePasswordSchema = z
  .object({
    body: z.object({
      oldPassword: z.string().min(1, 'Old password is required'),
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
    message: 'Passwords do not match',
    path: ['body', 'confirmPassword'],
  });

export const forgotPasswordSchema = z.object({
  body: z.object({
    universityId: z.string().min(1, 'University ID is required'),
  }),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    universityId: z.string().min(1, 'University ID is required'),
    otp: z.string().length(6, 'OTP must be 6 digits'),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least 1 uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least 1 lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least 1 number')
      .regex(/[@$!%*?&]/, 'Password must contain at least 1 special character'),
  }),
});

export type LoginInput = z.infer<typeof loginSchema>['body'];
export type FirstTimeLoginInput = z.infer<typeof firstTimeLoginSchema>['body'];
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>['body'];
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>['body'];
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>['body'];
