/**
 * every route follows the same middleware chain:
 *   authenticate → authorize → [upload] → validate → handler
 *
 * Access: SUPER_ADMIN full access.
 *         PROVOST full access except hall-info (read-only for them).
 *         HOUSE_TUTOR no write access (public reads only).
 */

import { Router } from 'express';
import { authenticate } from '@/shared/middleware/authenticate';
import { authorize } from '@/shared/middleware/authorize';
import { uploadImage, handleMulterError } from '@/shared/middleware/upload.middleware';
import { validate } from '@/shared/middleware/validate';
import { clearCache } from '@/shared/middleware/cache.middleware';
import { strictRateLimiter } from '@/shared/middleware/rateLimit.middleware';
import { z } from 'zod';

import {
  hallInfoSchema,
  facilitySchema,
  faqSchema,
  diningInfoSchema,
  achievementSchema,
  noticeSchema,
  eventSchema,
  galleryItemSchema,
  houseTutorSchema,
  staffProfileSchema,
  admissionInfoSchema,
  pageContentSchema,
} from '../validations/admin.validation';

import {
  hallInfoHandlers,
  facilityHandlers,
  faqHandlers,
  diningHandlers,
  achievementHandlers,
  noticeHandlers,
  eventHandlers,
  galleryHandlers,
  houseTutorHandlers,
  staffHandlers,
  admissionHandlers,
  pageContentHandlers,
} from '../controllers/admin.controller';

const router = Router();

// ─────────────────────────────────────────────
// Shared auth middleware applied to ALL routes
// ─────────────────────────────────────────────

router.use(authenticate);
router.use(strictRateLimiter);

// ─────────────────────────────────────────────
// Route registration factory
//
// Wires POST / PATCH /:id / DELETE /:id
// for a given resource path, handler set,
// validation schema, and optional image upload.
// ─────────────────────────────────────────────

function registerContentRoutes(options: {
  path: string;
  handlers: { create: any; update: any; delete: any };
  schema: z.ZodObject<any>;
  roles?: string[];
  hasImage?: boolean;
  cacheKeys?: string[];
}) {
  const {
    path,
    handlers,
    schema,
    roles = ['SUPER_ADMIN', 'PROVOST'],
    hasImage = false,
    cacheKeys = [],
  } = options;

  const bustCache = cacheKeys.length
    ? (_req: any, _res: any, next: any) => {
        cacheKeys.forEach(clearCache);
        next();
      }
    : (_req: any, _res: any, next: any) => next();

  const uploadMiddleware = hasImage ? [uploadImage.single('image'), handleMulterError] : [];

  const authMiddleware = authorize(...(roles as any[]));

  // POST — full schema validation
  router.post(
    path,
    authMiddleware,
    ...uploadMiddleware,
    validate(schema, 'body'),
    bustCache,
    handlers.create,
  );

  // PATCH /:id — partial schema (all fields optional)
  router.patch(
    `${path}/:id`,
    authMiddleware,
    ...uploadMiddleware,
    validate(schema.partial(), 'body'),
    bustCache,
    handlers.update,
  );

  // DELETE /:id
  router.delete(`${path}/:id`, authMiddleware, bustCache, handlers.delete);
}

// ─────────────────────────────────────────────
// Route registration table
// This is the SINGLE SOURCE OF TRUTH for all
// admin content endpoints. Adding a new content
// model = adding one entry here.
// ─────────────────────────────────────────────

registerContentRoutes({
  path: '/hall-info',
  handlers: hallInfoHandlers,
  schema: hallInfoSchema,
  roles: ['SUPER_ADMIN'], // PROVOST cannot change hall info
  hasImage: true,
  cacheKeys: ['/hall-info', '/about'],
});

registerContentRoutes({
  path: '/facilities',
  handlers: facilityHandlers,
  schema: facilitySchema,
  hasImage: true,
  cacheKeys: ['/facilities'],
});

registerContentRoutes({
  path: '/faq',
  handlers: faqHandlers,
  schema: faqSchema,
  hasImage: false,
  cacheKeys: ['/faq'],
});

registerContentRoutes({
  path: '/dining',
  handlers: diningHandlers,
  schema: diningInfoSchema,
  hasImage: true,
  cacheKeys: ['/dining'],
});

registerContentRoutes({
  path: '/achievements',
  handlers: achievementHandlers,
  schema: achievementSchema,
  hasImage: true,
  cacheKeys: ['/achievements'],
});

registerContentRoutes({
  path: '/notices',
  handlers: noticeHandlers,
  schema: noticeSchema,
  hasImage: true,
  cacheKeys: ['/notices'],
});

registerContentRoutes({
  path: '/events',
  handlers: eventHandlers,
  schema: eventSchema,
  hasImage: true,
  cacheKeys: ['/events'],
});

registerContentRoutes({
  path: '/gallery',
  handlers: galleryHandlers,
  schema: galleryItemSchema,
  hasImage: true,
  cacheKeys: ['/gallery'],
});

registerContentRoutes({
  path: '/house-tutors',
  handlers: houseTutorHandlers,
  schema: houseTutorSchema,
  hasImage: true,
  cacheKeys: ['/house-tutors'],
});

registerContentRoutes({
  path: '/staff',
  handlers: staffHandlers,
  schema: staffProfileSchema,
  hasImage: true,
  cacheKeys: ['/staff'],
});

registerContentRoutes({
  path: '/admission',
  handlers: admissionHandlers,
  schema: admissionInfoSchema,
  hasImage: false,
  cacheKeys: ['/admission'],
});

registerContentRoutes({
  path: '/page-content',
  handlers: pageContentHandlers,
  schema: pageContentSchema,
  hasImage: false,
  cacheKeys: ['/about', '/admission'],
});

export default router;
