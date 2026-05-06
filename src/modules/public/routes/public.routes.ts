import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '@/shared/middleware/authenticate';
import { authorize } from '@/shared/middleware/authorize';
import { uploadImage, handleMulterError } from '@/shared/middleware/upload.middleware';
import { validate } from '@/shared/middleware/validate';
import { sendError } from '@/shared/utils/response.util';
import { publicRateLimiter, strictRateLimiter } from '@/shared/middleware/rateLimit.middleware';
import { cacheResponse, clearCache, CACHE_DURATION } from '@/shared/middleware/cache.middleware';
import { provostHistoryBodySchema } from '../validations/public.validation';
import * as controller from '../controllers/public.controller';
import * as service from '../services/public.service';

const router = Router();

// ─────────────────────────────────────────────
// Self-edit guard
//
// A PROVOST cannot modify the ProvostHistory record
// that is linked to their own User account.
// This is a DATA-LEVEL rule, not a role-level rule,
// so it cannot be expressed with authorize() alone.
//
// SUPER_ADMIN always passes through.
// Historical records with no userId always pass through.
// ─────────────────────────────────────────────

const denyProvostSelfEdit = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (req.user?.role === 'SUPER_ADMIN') return next();

    const id = req.params.id as string;
    const record = await service.getProvostRecordInternal(id);
    if (!record) return next();
    if (record.userId && record.userId === req.user?.userId) {
      sendError(
        res,
        'You cannot modify your own provost record. Contact the Super Admin.',
        403,
        'SELF_EDIT_FORBIDDEN',
      );
      return;
    }

    next();
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// Cache-busting middleware (inline, reusable)
// Placed BEFORE the controller so cache is cleared
// even if the controller throws (edge case safety).
// ─────────────────────────────────────────────

const bustProvostCache = (_req: Request, _res: Response, next: NextFunction) => {
  clearCache('/provosts');
  clearCache('/provost');
  next();
};

// ─────────────────────────────────────────────
// PUBLIC READ - no auth required
// ─────────────────────────────────────────────

router.get(
  '/hall-info',
  publicRateLimiter,
  cacheResponse(CACHE_DURATION.VERY_LONG),
  controller.getHallInfo,
);
router.get(
  '/about',
  publicRateLimiter,
  cacheResponse(CACHE_DURATION.VERY_LONG),
  controller.getAbout,
);
router.get(
  '/provost',
  publicRateLimiter,
  cacheResponse(CACHE_DURATION.LONG),
  controller.getProvost,
);
router.get(
  '/provosts',
  publicRateLimiter,
  cacheResponse(CACHE_DURATION.LONG),
  controller.getProvostHistory,
);
router.get(
  '/house-tutors',
  publicRateLimiter,
  cacheResponse(CACHE_DURATION.LONG),
  controller.getHouseTutors,
);
router.get('/staff', publicRateLimiter, cacheResponse(CACHE_DURATION.LONG), controller.getStaff);
router.get(
  '/facilities',
  publicRateLimiter,
  cacheResponse(CACHE_DURATION.VERY_LONG),
  controller.getFacilities,
);
router.get(
  '/dining',
  publicRateLimiter,
  cacheResponse(CACHE_DURATION.MEDIUM),
  controller.getDining,
);
router.get(
  '/achievements',
  publicRateLimiter,
  cacheResponse(CACHE_DURATION.LONG),
  controller.getAchievements,
);
router.get('/events', publicRateLimiter, cacheResponse(CACHE_DURATION.SHORT), controller.getEvents);
router.get(
  '/notices',
  publicRateLimiter,
  cacheResponse(CACHE_DURATION.SHORT),
  controller.getNotices,
);
router.get(
  '/notices/:noticeId',
  publicRateLimiter,
  cacheResponse(CACHE_DURATION.MEDIUM),
  controller.getNoticeById,
);
router.get(
  '/gallery',
  publicRateLimiter,
  cacheResponse(CACHE_DURATION.MEDIUM),
  controller.getGallery,
);
router.get('/faq', publicRateLimiter, cacheResponse(CACHE_DURATION.VERY_LONG), controller.getFAQ);
router.get(
  '/admission',
  publicRateLimiter,
  cacheResponse(CACHE_DURATION.LONG),
  controller.getAdmission,
);

// No cache — user expects live status on this one
router.get('/applications/track/:applicationId', publicRateLimiter, controller.trackApplication);

// ─────────────────────────────────────────────
// PUBLIC WRITE - no auth, strict rate limit
// ─────────────────────────────────────────────

router.post('/contact', strictRateLimiter, controller.submitContact);
router.post('/applications', strictRateLimiter, controller.submitApplication);

// ─────────────────────────────────────────────
// PROVOST HISTORY - protected write routes
//
// POST   /provosts       → SUPER_ADMIN, PROVOST
// PATCH  /provosts/:id  → SUPER_ADMIN, PROVOST (self-edit blocked)
// DELETE /provosts/:id  → SUPER_ADMIN, PROVOST (self-delete blocked)
// ─────────────────────────────────────────────

router.post(
  '/provosts',
  authenticate,
  authorize('SUPER_ADMIN', 'PROVOST'),
  uploadImage.single('photo'),
  handleMulterError,
  validate(provostHistoryBodySchema, 'body'),
  bustProvostCache,
  controller.createProvost,
);

router.patch(
  '/provosts/:id',
  authenticate,
  authorize('SUPER_ADMIN', 'PROVOST'),
  denyProvostSelfEdit,
  uploadImage.single('photo'),
  handleMulterError,
  validate(provostHistoryBodySchema.partial(), 'body'),
  bustProvostCache,
  controller.updateProvost,
);

router.delete(
  '/provosts/:id',
  authenticate,
  authorize('SUPER_ADMIN', 'PROVOST'),
  denyProvostSelfEdit,
  bustProvostCache,
  controller.deleteProvost,
);

export default router;
