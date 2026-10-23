import { timingSafeEqual } from 'node:crypto';
import { Request } from 'express';
import { env } from '@/config/env.config';

const safeEqual = (a: string, b: string) => {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
};

/**
 * The reader's IP. Behind the web app's /api proxy every request comes from
 * the proxy, so it forwards the reader's IP in x-client-ip together with the
 * shared INTERNAL_API_KEY. Without the key the header is ignored: anyone
 * could send it to dodge rate limits.
 */
export const clientIp = (req: Request): string => {
  const key = req.get('x-internal-key');
  if (env.INTERNAL_API_KEY && key && safeEqual(key, env.INTERNAL_API_KEY)) {
    return req.get('x-client-ip') || req.ip || 'unknown';
  }
  return req.ip || 'unknown';
};
