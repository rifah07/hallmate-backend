import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('5000'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  ALLOWED_ORIGINS: z.string().default('http://localhost:3000'),
  // A short secret lets anyone forge login tokens
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  BCRYPT_ROUNDS: z.string().default('10'),
  // Email through Resend. Empty key: emails are logged (fine for development)
  RESEND_API_KEY: z.string().optional(),
  // Resend's shared test sender until you verify a domain of your own
  EMAIL_FROM: z.string().email().default('onboarding@resend.dev'),
  EMAIL_FROM_NAME: z.string().default('HallMate'),
  DEV_EMAIL_TO: z.string().email().optional(), // development only: send every email here
  // Shared with the web app's /api proxy; lets it pass the reader's IP
  INTERNAL_API_KEY: z
    .string()
    .min(32)
    .optional()
    .or(z.literal('').transform(() => undefined)),
  // Online payments. Unset = the pay button answers "not available yet";
  // the office can still record cash and bank payments.
  SSLCOMMERZ_STORE_ID: z.string().optional(),
  SSLCOMMERZ_STORE_PASSWORD: z.string().optional(),
  SSLCOMMERZ_LIVE: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true'),
  // Public URLs the gateway sends the payer and its IPN back to
  API_PUBLIC_URL: z.string().url().default('http://localhost:5000'),
  WEB_APP_URL: z.string().url().default('http://localhost:3000'),
});

const envValidation = envSchema
  // One leaked secret must not unlock both token types
  .refine((e) => e.JWT_SECRET !== e.JWT_REFRESH_SECRET, {
    message: 'JWT_SECRET and JWT_REFRESH_SECRET must be different',
    path: ['JWT_REFRESH_SECRET'],
  })
  .safeParse(process.env);

if (!envValidation.success) {
  console.error('Invalid environment variables:');
  console.error(envValidation.error.format());
  process.exit(1);
}

export const env = envValidation.data;
