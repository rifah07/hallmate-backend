import { cloudinaryService } from '@/shared/services/cloudinary.service';
import { NotFoundError, BadRequestError } from '@/shared/errors';
import { publicRepository } from '../repositories/public.repository';
import type {
  ContactBody,
  PublicApplicationBody,
  ProvostHistoryBody,
} from '../validations/public.validation';

const PROVOST_FOLDER = 'hallmate/provosts';

// ─────────────────────────────────────────────
// Shared pagination meta builder
// ─────────────────────────────────────────────

export function buildMeta(total: number, page: number, limit: number) {
  return { page, limit, total, totalPages: Math.ceil(total / limit) };
}

// ─────────────────────────────────────────────
// 1. Hall Info
// ─────────────────────────────────────────────

export async function getHallInfo() {
  return publicRepository.findHallInfo();
}

// ─────────────────────────────────────────────
// 2. About
// ─────────────────────────────────────────────

export async function getAboutContent() {
  const [hallInfo, pageContent] = await Promise.all([
    publicRepository.findHallInfo(),
    publicRepository.findPageContent('about'),
  ]);

  return {
    hallInfo: hallInfo
      ? {
          name: hallInfo.name,
          established: hallInfo.established,
          location: hallInfo.location,
          description: hallInfo.description,
          vision: hallInfo.vision,
          mission: hallInfo.mission,
          capacity: hallInfo.capacity,
          totalRooms: hallInfo.totalRooms,
          logoUrl: hallInfo.logoUrl,
          coverUrl: hallInfo.coverUrl,
        }
      : null,
    pageContent: pageContent?.content ?? null,
  };
}

// ─────────────────────────────────────────────
// 3. Provost (current user)
// ─────────────────────────────────────────────

export async function getProvostInfo() {
  const provost = await publicRepository.findCurrentProvostUser();
  if (!provost) throw new NotFoundError('Provost information not available');
  return provost;
}

// ─────────────────────────────────────────────
// 4. House Tutors
// ─────────────────────────────────────────────

export async function getHouseTutors() {
  return publicRepository.findHouseTutors();
}

// ─────────────────────────────────────────────
// 5. Staff
// ─────────────────────────────────────────────

export async function getStaffList(params: {
  page: number;
  limit: number;
  category?: string;
  search?: string;
}) {
  const [data, total] = await publicRepository.findStaff(params);
  return { data, meta: buildMeta(total, params.page, params.limit) };
}

// ─────────────────────────────────────────────
// 6. Facilities
// ─────────────────────────────────────────────

export async function getFacilities(params: { category?: string }) {
  return publicRepository.findFacilities(params);
}

// ─────────────────────────────────────────────
// 7. Dining
// ─────────────────────────────────────────────

export async function getDiningInfo() {
  const dining = await publicRepository.findDiningInfo();
  if (!dining) throw new NotFoundError('Dining information not available');
  return dining;
}

// ─────────────────────────────────────────────
// 8. Achievements
// ─────────────────────────────────────────────

export async function getAchievements(params: {
  page: number;
  limit: number;
  category?: string;
  year?: number;
}) {
  const [data, total] = await publicRepository.findAchievements(params);
  return { data, meta: buildMeta(total, params.page, params.limit) };
}

// ─────────────────────────────────────────────
// 9. Events
// ─────────────────────────────────────────────

export async function getEvents(params: {
  page: number;
  limit: number;
  search?: string;
  upcoming?: boolean;
  featured?: boolean;
}) {
  const [data, total] = await publicRepository.findEvents(params);
  return { data, meta: buildMeta(total, params.page, params.limit) };
}

// ─────────────────────────────────────────────
// 10. Notices
// ─────────────────────────────────────────────

export async function getNotices(params: {
  page: number;
  limit: number;
  category?: string;
  priority?: string;
  search?: string;
}) {
  const [data, total] = await publicRepository.findNotices(params);
  return { data, meta: buildMeta(total, params.page, params.limit) };
}

export async function getNoticeById(noticeId: string) {
  const notice = await publicRepository.findNoticeById(noticeId);
  if (!notice) throw new NotFoundError('Notice not found or has expired');

  // Fire-and-forget — don't await, don't block the response
  // If this fails, it's not the user's problem
  publicRepository.incrementNoticeViews(noticeId).catch(() => {});

  return notice;
}

// ─────────────────────────────────────────────
// 11. Gallery
// ─────────────────────────────────────────────

export async function getGallery(params: {
  page: number;
  limit: number;
  category?: string;
  search?: string;
}) {
  const [data, total] = await publicRepository.findGallery(params);
  return { data, meta: buildMeta(total, params.page, params.limit) };
}

// ─────────────────────────────────────────────
// 12. FAQ
// ─────────────────────────────────────────────

export async function getFAQ(params: { category?: string; search?: string }) {
  return publicRepository.findFAQ(params);
}

// ─────────────────────────────────────────────
// 13. Admission
// ─────────────────────────────────────────────

export async function getAdmissionInfo() {
  const [current, pageContent] = await Promise.all([
    publicRepository.findCurrentAdmissionInfo(),
    publicRepository.findPageContent('admission'),
  ]);

  return { current, extra: pageContent?.content ?? null };
}

// ─────────────────────────────────────────────
// 14. Contact
// ─────────────────────────────────────────────

export async function submitContact(body: ContactBody, ipAddress?: string) {
  return publicRepository.createContactSubmission({ ...body, ipAddress });
}

// ─────────────────────────────────────────────
// 15. Public Application
// ─────────────────────────────────────────────

export async function submitPublicApplication(body: PublicApplicationBody, ipAddress?: string) {
  return publicRepository.createPublicApplication({
    ...body,
    status: 'PENDING',
    attachments: body.attachments ?? [],
    ipAddress,
  });
}

// ─────────────────────────────────────────────
// 16. Application Tracking
// ─────────────────────────────────────────────

export async function trackApplication(applicationId: string) {
  const application = await publicRepository.findApplicationById(applicationId);
  if (!application) throw new NotFoundError('Application not found');
  return application;
}

// ─────────────────────────────────────────────
// 17. Provost History — read
// ─────────────────────────────────────────────

export async function getProvostHistory() {
  return publicRepository.findProvostHistory();
}

/**
 * Used ONLY by the self-edit guard middleware.
 * Returns internal fields (userId, photoPublicId).
 * Never call this from a controller.
 */
export async function getProvostRecordInternal(id: string) {
  return publicRepository.findProvostByIdInternal(id);
}

// ─────────────────────────────────────────────
// 17. Provost History - write
// ─────────────────────────────────────────────

export async function createProvostRecord(body: ProvostHistoryBody, file?: Express.Multer.File) {
  if (file) {
    const check = cloudinaryService.validateImageFile(file);
    if (!check.valid) throw new BadRequestError(check.error!);
  }

  const photo = file ? await cloudinaryService.uploadImage(file.buffer, PROVOST_FOLDER) : null;

  // Business rule: only one current provost at a time
  if (body.isCurrent) {
    await publicRepository.unmarkAllCurrentProvosts();
  }

  return publicRepository.createProvostRecord({
    name: body.name,
    designation: body.designation ?? 'Provost',
    department: body.department,
    tenureStart: body.tenureStart,
    tenureEnd: body.tenureEnd ?? null,
    isCurrent: body.isCurrent ?? false,
    bio: body.bio,
    sortOrder: typeof body.sortOrder === 'number' ? body.sortOrder : 0,
    userId: body.userId ?? null,
    photoUrl: photo?.url,
    photoPublicId: photo?.publicId,
  } as any);
}

export async function updateProvostRecord(
  id: string,
  body: Partial<ProvostHistoryBody>,
  file?: Express.Multer.File,
) {
  // Repository handles the "not found" case by returning null
  // but service is responsible for the business rule: "record must exist"
  const existing = await publicRepository.findProvostByIdInternal(id);
  if (!existing) throw new NotFoundError('Provost record not found');

  if (file) {
    const check = cloudinaryService.validateImageFile(file);
    if (!check.valid) throw new BadRequestError(check.error!);
  }

  let photoUrl = existing.photoUrl ?? undefined;
  let photoPublicId = existing.photoPublicId ?? undefined;

  if (file) {
    // Delete old asset first — non-fatal if it fails (asset may already be gone)
    if (existing.photoPublicId) {
      await cloudinaryService.deleteImage(existing.photoPublicId).catch(() => {});
    }
    const uploaded = await cloudinaryService.uploadImage(file.buffer, PROVOST_FOLDER);
    photoUrl = uploaded.url;
    photoPublicId = uploaded.publicId;
  }

  // Business rule: only one current provost at a time
  if (body.isCurrent) {
    await publicRepository.unmarkAllCurrentProvosts(id);
  }

  return publicRepository.updateProvostRecord(id, {
    ...(body.name !== undefined && { name: body.name }),
    ...(body.designation !== undefined && { designation: body.designation }),
    ...(body.department !== undefined && { department: body.department }),
    ...(body.tenureStart !== undefined && { tenureStart: body.tenureStart }),
    ...(body.tenureEnd !== undefined && { tenureEnd: body.tenureEnd ?? null }),
    ...(body.isCurrent !== undefined && { isCurrent: body.isCurrent }),
    ...(body.bio !== undefined && { bio: body.bio }),
    ...(body.sortOrder !== undefined && { sortOrder: body.sortOrder as number }),
    ...(body.userId !== undefined && { userId: body.userId ?? null }),
    photoUrl,
    photoPublicId,
  });
}

export async function deleteProvostRecord(id: string) {
  const existing = await publicRepository.findProvostByIdInternal(id);
  if (!existing) throw new NotFoundError('Provost record not found');

  // Clean up Cloudinary asset before deleting DB record
  // Order matters: if DB delete fails, we don't want an orphaned Cloudinary asset
  if (existing.photoPublicId) {
    await cloudinaryService.deleteImage(existing.photoPublicId).catch(() => {});
  }

  await publicRepository.deleteProvostRecord(id);
}
