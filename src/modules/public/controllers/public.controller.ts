import { Request, Response, NextFunction } from 'express';
import { sendSuccess, sendError, sendPaginatedSuccess } from '@/shared/utils/response.util';
import * as service from '../services/public.service';
import {
  galleryQuerySchema,
  noticeListQuerySchema,
  noticeIdParamSchema,
  eventQuerySchema,
  achievementQuerySchema,
  staffQuerySchema,
  faqQuerySchema,
  facilityQuerySchema,
  contactBodySchema,
  publicApplicationBodySchema,
  trackApplicationParamSchema,
} from '../validations/public.validation';

/** Extract real client IP, respecting proxies */
const getIp = (req: Request) =>
  (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress;

/**
 * Inline Zod parse for query/param validation on public routes.
 * Returns parsed data or sends a 400 and returns null.
 * The caller checks `if (!query) return;` — clean and explicit.
 */
function parseOrFail<T>(
  schema: { safeParse: (v: unknown) => { success: boolean; data?: T; error?: any } },
  input: unknown,
  res: Response,
): T | null {
  const result = schema.safeParse(input);
  if (!result.success) {
    sendError(
      res,
      'Invalid parameters',
      400,
      'VALIDATION_ERROR',
      result.error?.flatten().fieldErrors,
    );
    return null;
  }
  return result.data!;
}

// ─────────────────────────────────────────────
// Public READ handlers
// ─────────────────────────────────────────────

export async function getHallInfo(_req: Request, res: Response, next: NextFunction) {
  try {
    sendSuccess(res, await service.getHallInfo());
  } catch (err) {
    next(err);
  }
}

export async function getAbout(_req: Request, res: Response, next: NextFunction) {
  try {
    sendSuccess(res, await service.getAboutContent());
  } catch (err) {
    next(err);
  }
}

export async function getProvost(_req: Request, res: Response, next: NextFunction) {
  try {
    sendSuccess(res, await service.getProvostInfo());
  } catch (err) {
    next(err);
  }
}

export async function getHouseTutors(_req: Request, res: Response, next: NextFunction) {
  try {
    sendSuccess(res, await service.getHouseTutors());
  } catch (err) {
    next(err);
  }
}

export async function getStaff(req: Request, res: Response, next: NextFunction) {
  try {
    const query = parseOrFail(staffQuerySchema, req.query, res);
    if (!query) return;
    const { data, meta } = await service.getStaffList(query);
    sendPaginatedSuccess(res, data, meta);
  } catch (err) {
    next(err);
  }
}

export async function getFacilities(req: Request, res: Response, next: NextFunction) {
  try {
    const query = parseOrFail(facilityQuerySchema, req.query, res);
    if (!query) return;
    sendSuccess(res, await service.getFacilities(query));
  } catch (err) {
    next(err);
  }
}

export async function getDining(_req: Request, res: Response, next: NextFunction) {
  try {
    sendSuccess(res, await service.getDiningInfo());
  } catch (err) {
    next(err);
  }
}

export async function getAchievements(req: Request, res: Response, next: NextFunction) {
  try {
    const query = parseOrFail(achievementQuerySchema, req.query, res);
    if (!query) return;
    const { data, meta } = await service.getAchievements(query);
    sendPaginatedSuccess(res, data, meta);
  } catch (err) {
    next(err);
  }
}

export async function getEvents(req: Request, res: Response, next: NextFunction) {
  try {
    const query = parseOrFail(eventQuerySchema, req.query, res);
    if (!query) return;
    const { data, meta } = await service.getEvents(query);
    sendPaginatedSuccess(res, data, meta);
  } catch (err) {
    next(err);
  }
}

export async function getNotices(req: Request, res: Response, next: NextFunction) {
  try {
    const query = parseOrFail(noticeListQuerySchema, req.query, res);
    if (!query) return;
    const { data, meta } = await service.getNotices(query);
    sendPaginatedSuccess(res, data, meta);
  } catch (err) {
    next(err);
  }
}

export async function getNoticeById(req: Request, res: Response, next: NextFunction) {
  try {
    const params = parseOrFail(noticeIdParamSchema, req.params, res);
    if (!params) return;
    sendSuccess(res, await service.getNoticeById(params.noticeId));
  } catch (err) {
    next(err);
  }
}

export async function getGallery(req: Request, res: Response, next: NextFunction) {
  try {
    const query = parseOrFail(galleryQuerySchema, req.query, res);
    if (!query) return;
    const { data, meta } = await service.getGallery(query);
    sendPaginatedSuccess(res, data, meta);
  } catch (err) {
    next(err);
  }
}

export async function getFAQ(req: Request, res: Response, next: NextFunction) {
  try {
    const query = parseOrFail(faqQuerySchema, req.query, res);
    if (!query) return;
    sendSuccess(res, await service.getFAQ(query));
  } catch (err) {
    next(err);
  }
}

export async function getAdmission(_req: Request, res: Response, next: NextFunction) {
  try {
    sendSuccess(res, await service.getAdmissionInfo());
  } catch (err) {
    next(err);
  }
}

export async function getProvostHistory(_req: Request, res: Response, next: NextFunction) {
  try {
    sendSuccess(res, await service.getProvostHistory());
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────
// Public WRITE handlers
// ─────────────────────────────────────────────

export async function submitContact(req: Request, res: Response, next: NextFunction) {
  try {
    const body = parseOrFail(contactBodySchema, req.body, res);
    if (!body) return;
    const data = await service.submitContact(body, getIp(req));
    sendSuccess(res, data, 'Message submitted. We will get back to you shortly.', 201);
  } catch (err) {
    next(err);
  }
}

export async function submitApplication(req: Request, res: Response, next: NextFunction) {
  try {
    const body = parseOrFail(publicApplicationBodySchema, req.body, res);
    if (!body) return;
    const data = await service.submitPublicApplication(body, getIp(req));
    sendSuccess(res, data, `Application submitted. Tracking ID: ${data.id}`, 201);
  } catch (err) {
    next(err);
  }
}

export async function trackApplication(req: Request, res: Response, next: NextFunction) {
  try {
    const params = parseOrFail(trackApplicationParamSchema, req.params, res);
    if (!params) return;
    sendSuccess(res, await service.trackApplication(params.applicationId));
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────
// Provost History - admin write handlers
// Auth + role guard is wired in the router.
// Body is pre-validated by validate() middleware.
// These handlers stay 3 lines each - intentionally.
// ─────────────────────────────────────────────

export async function createProvost(req: Request, res: Response, next: NextFunction) {
  try {
    sendSuccess(
      res,
      await service.createProvostRecord(req.body, req.file),
      'Provost record created',
      201,
    );
  } catch (err) {
    next(err);
  }
}

export async function updateProvost(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    sendSuccess(
      res,
      await service.updateProvostRecord(id, req.body, req.file),
      'Provost record updated',
    );
  } catch (err) {
    next(err);
  }
}

export async function deleteProvost(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    await service.deleteProvostRecord(id);
    sendSuccess(res, null, 'Provost record deleted');
  } catch (err) {
    next(err);
  }
}
