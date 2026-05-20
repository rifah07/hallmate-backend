/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 *
 * DRY: The generic makeContentService() factory produces
 * create/update/delete for any model that supports image uploads.
 * Models without images just pass { hasImage: false }.
 *
 * KISS: Each exported service function is the public API.
 * Complex models (notice, event, gallery) get their own focused functions.
 * Simple models (FAQ, achievement) use the generic factory directly.
 */

import { cloudinaryService } from '@/shared/services/cloudinary.service';
import { BadRequestError, NotFoundError, ConflictError } from '@/shared/errors';
import {
  hallInfoRepo,
  facilityRepo,
  faqRepo,
  diningRepo,
  achievementRepo,
  noticeRepo,
  eventRepo,
  galleryRepo,
  houseTutorRepo,
  staffRepo,
  admissionRepo,
  pageContentRepo,
  adminRepository,
} from '../repositories/admin.repository';
import type {
  HallInfoBody,
  FacilityBody,
  FAQBody,
  DiningInfoBody,
  AchievementBody,
  NoticeBody,
  EventBody,
  GalleryItemBody,
  HouseTutorBody,
  StaffProfileBody,
  AdmissionInfoBody,
  PageContentBody,
} from '../validations/admin.validation';

// ─────────────────────────────────────────────
// Generic content service factory
//
// Produces create/update/delete for a repo.
// Handles optional image upload/delete via Cloudinary.
// ─────────────────────────────────────────────

function makeContentService<TBody extends Record<string, any>>(
  repo: {
    findById: (id: string) => Promise<any>;
    create: (data: any) => Promise<any>;
    update: (id: string, data: any) => Promise<any>;
    delete: (id: string) => Promise<any>;
  },
  options: {
    folder?: string; // Cloudinary folder - if set, image upload is supported
    imageField?: string; // DB field name for image URL (default: 'imageUrl')
    publicIdField?: string; // DB field name for Cloudinary public ID (default: 'imagePublicId')
  } = {},
) {
  const { folder, imageField = 'imageUrl', publicIdField = 'imagePublicId' } = options;

  async function uploadImage(file: Express.Multer.File) {
    if (!folder) throw new BadRequestError('Image upload not supported for this resource');
    const check = cloudinaryService.validateImageFile(file);
    if (!check.valid) throw new BadRequestError(check.error!);
    return cloudinaryService.uploadImage(file.buffer, folder);
  }

  return {
    async create(body: TBody, file?: Express.Multer.File) {
      const data: any = { ...body };

      if (file) {
        const uploaded = await uploadImage(file);
        data[imageField] = uploaded.url;
        if (publicIdField) data[publicIdField] = uploaded.publicId;
      }

      return repo.create(data);
    },

    async update(id: string, body: Partial<TBody>, file?: Express.Multer.File) {
      const existing = await repo.findById(id);
      if (!existing) throw new NotFoundError('Record not found');

      const data: any = { ...body };

      if (file) {
        // Delete old Cloudinary asset - non-fatal
        if (existing[publicIdField]) {
          await cloudinaryService.deleteImage(existing[publicIdField]).catch(() => {});
        }
        const uploaded = await uploadImage(file);
        data[imageField] = uploaded.url;
        if (publicIdField) data[publicIdField] = uploaded.publicId;
      }

      return repo.update(id, data);
    },

    async delete(id: string) {
      const existing = await repo.findById(id);
      if (!existing) throw new NotFoundError('Record not found');

      if (existing[publicIdField]) {
        await cloudinaryService.deleteImage(existing[publicIdField]).catch(() => {});
      }

      return repo.delete(id);
    },
  };
}

// ─────────────────────────────────────────────
// Service instances — one line per model
// Models with images pass folder + field names.
// Models without images omit options entirely.
// ─────────────────────────────────────────────

const hallInfoService = makeContentService<HallInfoBody>(hallInfoRepo, {
  folder: 'hallmate/hall',
  imageField: 'coverUrl',
  publicIdField: 'coverPublicId',
});
const facilityService = makeContentService<FacilityBody>(facilityRepo, {
  folder: 'hallmate/facilities',
  imageField: 'imageUrl',
  publicIdField: 'imagePublicId',
});
const faqService = makeContentService<FAQBody>(faqRepo);
const diningService = makeContentService<DiningInfoBody>(diningRepo, {
  folder: 'hallmate/dining',
  imageField: 'imageUrl',
  publicIdField: 'imagePublicId',
});
const achievementService = makeContentService<AchievementBody>(achievementRepo, {
  folder: 'hallmate/achievements',
  imageField: 'imageUrl',
  publicIdField: 'imagePublicId',
});
const noticeService = makeContentService<NoticeBody>(noticeRepo, {
  folder: 'hallmate/notices',
  imageField: 'imageUrl',
  publicIdField: 'imagePublicId',
});
const eventService = makeContentService<EventBody>(eventRepo, {
  folder: 'hallmate/events',
  imageField: 'imageUrl',
  publicIdField: 'imagePublicId',
});
const galleryService = makeContentService<GalleryItemBody>(galleryRepo, {
  folder: 'hallmate/gallery',
  imageField: 'imageUrl',
  publicIdField: 'imagePublicId',
});
const houseTutorService = makeContentService<HouseTutorBody>(houseTutorRepo, {
  folder: 'hallmate/tutors',
  imageField: 'photoUrl',
  publicIdField: 'photoPublicId',
});
const staffService = makeContentService<StaffProfileBody>(staffRepo, {
  folder: 'hallmate/staff',
  imageField: 'photoUrl',
  publicIdField: 'photoPublicId',
});
const admissionService = makeContentService<AdmissionInfoBody>(admissionRepo);
const pageContentService = makeContentService<PageContentBody>(pageContentRepo);
