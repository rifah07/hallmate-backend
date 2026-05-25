import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '@/shared/utils/response.util';
import * as adminService from '../services/admin.service';

// ─────────────────────────────────────────────
// Generic handler factory
// ─────────────────────────────────────────────

type ServiceCreate = (body: any, file?: Express.Multer.File) => Promise<any>;
type ServiceUpdate = (id: string, body: any, file?: Express.Multer.File) => Promise<any>;
type ServiceDelete = (id: string) => Promise<any>;

/**
 * Produces three Express handlers for a content resource.
 * hasImage: true  → passes req.file to service (multipart routes)
 * hasImage: false → no file handling (JSON routes)
 */
function makeHandlers(
  createFn: ServiceCreate,
  updateFn: ServiceUpdate,
  deleteFn: ServiceDelete,
  messages: { created: string; updated: string; deleted: string },
  hasImage = false,
) {
  return {
    create: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const data = await createFn(req.body, hasImage ? req.file : undefined);
        sendSuccess(res, data, messages.created, 201);
      } catch (err) {
        next(err);
      }
    },

    update: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const data = await updateFn(
          req.params.id as string,
          req.body,
          hasImage ? req.file : undefined,
        );
        sendSuccess(res, data, messages.updated);
      } catch (err) {
        next(err);
      }
    },

    delete: async (req: Request, res: Response, next: NextFunction) => {
      try {
        await deleteFn(req.params.id as string);
        sendSuccess(res, null, messages.deleted);
      } catch (err) {
        next(err);
      }
    },
  };
}

// ─────────────────────────────────────────────
// Handler sets — one line per model
// ─────────────────────────────────────────────

export const hallInfoHandlers = makeHandlers(
  adminService.createHallInfo,
  adminService.updateHallInfo,
  adminService.deleteHallInfo,
  { created: 'Hall info created', updated: 'Hall info updated', deleted: 'Hall info deleted' },
  true, // has image (coverUrl)
);

export const facilityHandlers = makeHandlers(
  adminService.createFacility,
  adminService.updateFacility,
  adminService.deleteFacility,
  { created: 'Facility created', updated: 'Facility updated', deleted: 'Facility deleted' },
  true,
);

export const faqHandlers = makeHandlers(
  adminService.createFAQ,
  adminService.updateFAQ,
  adminService.deleteFAQ,
  { created: 'FAQ created', updated: 'FAQ updated', deleted: 'FAQ deleted' },
  false, // no image
);

export const diningHandlers = makeHandlers(
  adminService.createDiningInfo,
  adminService.updateDiningInfo,
  adminService.deleteDiningInfo,
  {
    created: 'Dining info created',
    updated: 'Dining info updated',
    deleted: 'Dining info deleted',
  },
  true,
);

export const achievementHandlers = makeHandlers(
  adminService.createAchievement,
  adminService.updateAchievement,
  adminService.deleteAchievement,
  {
    created: 'Achievement created',
    updated: 'Achievement updated',
    deleted: 'Achievement deleted',
  },
  true,
);

export const noticeHandlers = makeHandlers(
  adminService.createNotice,
  adminService.updateNotice,
  adminService.deleteNotice,
  { created: 'Notice created', updated: 'Notice updated', deleted: 'Notice deleted' },
  true,
);


export const eventHandlers = makeHandlers(
  adminService.createEvent,
  adminService.updateEvent,
  adminService.deleteEvent,
  { created: 'Event created', updated: 'Event updated', deleted: 'Event deleted' },
  true,
);

export const galleryHandlers = makeHandlers(
  adminService.createGalleryItem,
  adminService.updateGalleryItem,
  adminService.deleteGalleryItem,
  {
    created: 'Gallery item created',
    updated: 'Gallery item updated',
    deleted: 'Gallery item deleted',
  },
  true,
);

export const houseTutorHandlers = makeHandlers(
  adminService.createHouseTutor,
  adminService.updateHouseTutor,
  adminService.deleteHouseTutor,
  {
    created: 'House tutor created',
    updated: 'House tutor updated',
    deleted: 'House tutor deleted',
  },
  true,
);

export const staffHandlers = makeHandlers(
  adminService.createStaffProfile,
  adminService.updateStaffProfile,
  adminService.deleteStaffProfile,
  {
    created: 'Staff profile created',
    updated: 'Staff profile updated',
    deleted: 'Staff profile deleted',
  },
  true,
);
