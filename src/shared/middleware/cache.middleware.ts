/**
 * SYSTEM DESIGN LESSON 3: CACHING STRATEGY
 *
 * Why Cache?
 * 1. Reduces database load
 * 2. Faster response times
 * 3. Better user experience
 * 4. Cost savings (fewer DB queries)
 *
 * When to Cache?
 * - Data that doesn't change frequently (notices, provost message)
 * - Expensive queries (statistics, aggregations)
 * - Public data (safe to cache, no user-specific data)
 *
 * When NOT to Cache?
 * - User-specific data
 * - Frequently changing data
 * - Financial/critical data
 *
 * Cache Strategy:
 * - In-memory for development (simple, fast)
 * - Redis for production (distributed, persistent, TTL support)
 */

import { Request, Response, NextFunction } from 'express';

interface CacheEntry {
  data: any;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();

// Clean up expired entries every minute
setInterval(() => {
  const now = Date.now();
  cache.forEach((entry, key) => {
    if (entry.expiresAt < now) {
      cache.delete(key);
    }
  });
}, 60 * 1000);

/**
 * Simple response cache middleware
 *
 * Usage:
 * router.get('/notices', cacheResponse(5 * 60), controller.getNotices);
 *
 * @param ttlSeconds - Time to live in seconds
 */
export const cacheResponse = (ttlSeconds: number) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Create cache key from URL and query params
    const cacheKey = `${req.path}:${JSON.stringify(req.query)}`;

    // Check if cached
    const cached = cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      res.set('X-Cache', 'HIT');
      return res.json(cached.data);
    }

    // Store original json method
    const originalJson = res.json.bind(res);

    // Override json method to cache response
    res.json = function (data: any) {
      // Cache the response
      cache.set(cacheKey, {
        data,
        expiresAt: Date.now() + ttlSeconds * 1000,
      });

      res.set('X-Cache', 'MISS');
      res.set('Cache-Control', `public, max-age=${ttlSeconds}`);

      return originalJson(data);
    };

    next();
  };
};

/**
 * Clear cache for specific patterns
 * Useful when data is updated
 */
export const clearCache = (pattern?: string) => {
  if (!pattern) {
    cache.clear();
    return;
  }

  cache.forEach((_, key) => {
    if (key.includes(pattern)) {
      cache.delete(key);
    }
  });
};
