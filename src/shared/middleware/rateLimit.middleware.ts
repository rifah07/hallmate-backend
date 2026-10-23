import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { clientIp } from '@/shared/utils/client-ip.util';

// In-memory counters are per server instance. On serverless that makes the
// limits looser than written, never stricter; a shared store (Redis) would
// make them exact.
const limiter = (windowMinutes: number, limit: number, message: string) =>
  rateLimit({
    windowMs: windowMinutes * 60 * 1000,
    limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    keyGenerator: (req) => ipKeyGenerator(clientIp(req)), // IPv6: one bucket per /56
    // Tests log in dozens of times from one IP; limits get their own test
    skip: () => process.env.NODE_ENV === 'test' && !process.env.TEST_RATE_LIMITS,
    message: { success: false, error: { message, code: 'RATE_LIMIT_EXCEEDED' } },
  });

export const apiRateLimiter = limiter(15, 600, 'Too many requests, please try again later.');
export const publicRateLimiter = limiter(
  15,
  200,
  'Too many requests from this IP, please try again later',
);
export const strictRateLimiter = limiter(15, 30, 'Rate limit exceeded for this endpoint');
// Password guessing and code guessing: per IP, on top of the per-account caps
export const authRateLimiter = limiter(
  15,
  10,
  'Too many attempts. Please wait 15 minutes and try again.',
);
