/**
 * Correct middleware chain:
 *  authenticate → authorize → upload → validate → controller
                                                    ↓
                                              service write
                                                    ↓
                                            if no throw → clearCache()
 */

import { Router } from 'express';
import { authenticate } from '@/shared/middleware/authenticate';
import { authorize } from '@/shared/middleware/authorize';
import { uploadImage, handleMulterError } from '@/shared/middleware/upload.middleware';
import { validate } from '@/shared/middleware/validate';
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
// Shared middleware — applied to ALL routes
// ─────────────────────────────────────────────

router.use(authenticate);
router.use(strictRateLimiter);

// ─────────────────────────────────────────────
// Route registration factory
//
// Wires POST / PATCH /:id / DELETE /:id.
// No cache logic here — that's the service's job.
// ─────────────────────────────────────────────

function registerContentRoutes(options: {
  path: string;
  handlers: { create: any; update: any; delete: any };
  schema: z.ZodObject<any>;
  roles?: string[];
  hasImage?: boolean;
}) {
  const { path, handlers, schema, roles = ['SUPER_ADMIN', 'PROVOST'], hasImage = false } = options;

  const uploadMiddleware = hasImage ? [uploadImage.single('image'), handleMulterError] : [];

  const authMiddleware = authorize(...(roles as any[]));

  // POST — full schema validation
  router.post(path, authMiddleware, ...uploadMiddleware, validate(schema, 'body'), handlers.create);

  // PATCH /:id — all fields optional
  router.patch(
    `${path}/:id`,
    authMiddleware,
    ...uploadMiddleware,
    validate(schema.partial(), 'body'),
    handlers.update,
  );

  // DELETE /:id
  router.delete(`${path}/:id`, authMiddleware, handlers.delete);
}

// ─────────────────────────────────────────────
// Route registration table
// Single source of truth for all admin content
// endpoints. Adding a model = one entry here.
// ─────────────────────────────────────────────

registerContentRoutes({
  path: '/hall-info',
  handlers: hallInfoHandlers,
  schema: hallInfoSchema,
  roles: ['SUPER_ADMIN'], // PROVOST cannot change hall info
  hasImage: true,
});

registerContentRoutes({
  path: '/facilities',
  handlers: facilityHandlers,
  schema: facilitySchema,
  hasImage: true,
});

registerContentRoutes({
  path: '/faq',
  handlers: faqHandlers,
  schema: faqSchema,
  hasImage: false,
});

registerContentRoutes({
  path: '/dining',
  handlers: diningHandlers,
  schema: diningInfoSchema,
  hasImage: true,
});

registerContentRoutes({
  path: '/achievements',
  handlers: achievementHandlers,
  schema: achievementSchema,
  hasImage: true,
});

registerContentRoutes({
  path: '/notices',
  handlers: noticeHandlers,
  schema: noticeSchema,
  hasImage: true,
});

registerContentRoutes({
  path: '/events',
  handlers: eventHandlers,
  schema: eventSchema,
  hasImage: true,
});

registerContentRoutes({
  path: '/gallery',
  handlers: galleryHandlers,
  schema: galleryItemSchema,
  hasImage: true,
});

registerContentRoutes({
  path: '/house-tutors',
  handlers: houseTutorHandlers,
  schema: houseTutorSchema,
  hasImage: true,
});

registerContentRoutes({
  path: '/staff',
  handlers: staffHandlers,
  schema: staffProfileSchema,
  hasImage: true,
});

registerContentRoutes({
  path: '/admission',
  handlers: admissionHandlers,
  schema: admissionInfoSchema,
  hasImage: false,
});

registerContentRoutes({
  path: '/page-content',
  handlers: pageContentHandlers,
  schema: pageContentSchema,
  hasImage: false,
});

export default router;
