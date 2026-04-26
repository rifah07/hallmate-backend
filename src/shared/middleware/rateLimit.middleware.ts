/**
 * SYSTEM DESIGN LESSON 2: RATE LIMITING
 *
 * Why Rate Limiting?
 * 1. Prevents abuse/DOS attacks
 * 2. Ensures fair resource allocation
 * 3. Protects backend resources
 * 4. Improves overall system stability
 *
 * Strategy:
 * - Use in-memory store for development (simple)
 * - Use Redis in production (distributed, persistent)
 * - Different limits for different endpoints
 */

import { Request, Response, NextFunction } from 'express';

// Simple in-memory rate limiter (for development)
// In production, use Redis or a dedicated service

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

// Clean up old entries every 5 minutes
setInterval(
  () => {
    const now = Date.now();
    Object.keys(store).forEach((key) => {
      if (store[key].resetTime < now) {
        delete store[key];
      }
    });
  },
  5 * 60 * 1000,
);

export const createRateLimiter = (options: {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  message?: string;
}) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Use IP address as identifier
    const identifier = req.ip || req.socket.remoteAddress || 'unknown';
    const key = `${identifier}:${req.path}`;
    const now = Date.now();

    if (!store[key]) {
      store[key] = {
        count: 1,
        resetTime: now + options.windowMs,
      };
      return next();
    }

    // Reset if window expired
    if (store[key].resetTime < now) {
      store[key] = {
        count: 1,
        resetTime: now + options.windowMs,
      };
      return next();
    }

    // Increment count
    store[key].count++;

    // Check if limit exceeded
    if (store[key].count > options.maxRequests) {
      const retryAfter = Math.ceil((store[key].resetTime - now) / 1000);
      res.set('Retry-After', String(retryAfter));
      res.set('X-RateLimit-Limit', String(options.maxRequests));
      res.set('X-RateLimit-Remaining', '0');
      res.set('X-RateLimit-Reset', String(store[key].resetTime));

      return res.status(429).json({
        success: false,
        error: {
          message: options.message || 'Too many requests, please try again later',
          code: 'RATE_LIMIT_EXCEEDED',
        },
      });
    }

    // Set rate limit headers
    res.set('X-RateLimit-Limit', String(options.maxRequests));
    res.set('X-RateLimit-Remaining', String(options.maxRequests - store[key].count));
    res.set('X-RateLimit-Reset', String(store[key].resetTime));

    next();
  };
};