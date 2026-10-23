import { BadRequestError, ForbiddenError, NotFoundError } from '@/shared/errors';
import { cloudinaryService } from '@/shared/services/cloudinary.service';
import { JWTPayload } from '@/shared/utils/crypto/jwt.util';
import { decodeCursor, toPage } from '@/shared/utils/cursor.util';
import { notificationService } from '@/modules/notifications';
import notificationRepository from '@/modules/notifications/repositories/notification.repository';
import { roomRepository } from '@/modules/rooms';
import noticeRepository, { NoticeScope } from '../repositories/notice.repository';
import { CreateNoticeInput, UpdateNoticeInput } from '../validations/notice.validation';
import { UserRole } from '@prisma/client';

const HALL_WIDE_ROLES = ['SUPER_ADMIN', 'PROVOST'];

// A real PDF starts with these bytes; the browser's MIME type is just a claim
const isPdf = (buffer: Buffer) => buffer.subarray(0, 5).toString('latin1') === '%PDF-';

class NoticeService {
  /** Residents see hall-wide notices plus their floor's; staff without a floor see hall-wide only. */
  private async scopeFor(user: JWTPayload): Promise<NoticeScope> {
    if (HALL_WIDE_ROLES.includes(user.role)) return { seeAll: true };
    if (user.role === 'HOUSE_TUTOR')
      return { seeAll: false, floor: user.assignedFloor ?? undefined };
    if (user.role === 'STUDENT') {
      const bed = await roomRepository.findUserCurrentRoom(user.userId);
      return { seeAll: false, floor: bed?.room.floor };
    }
    return { seeAll: false };
  }

  /** The provost posts anywhere; a house tutor only to her own floor. */
  private assertCanTarget(user: JWTPayload, audience: string, targetFloor?: number | null) {
    if (HALL_WIDE_ROLES.includes(user.role)) return;
    if (user.role === 'HOUSE_TUTOR' && audience === 'FLOOR' && targetFloor === user.assignedFloor)
      return;
    throw new ForbiddenError('House tutors can post only to their own floor');
  }

  private async uploadPdf(file?: Express.Multer.File) {
    if (!file) return undefined;
    if (!isPdf(file.buffer)) throw new BadRequestError('The attachment is not a valid PDF');
    return (await cloudinaryService.uploadDocument(file.buffer, 'hallmate/notices')).url;
  }

  async create(user: JWTPayload, input: CreateNoticeInput, file?: Express.Multer.File) {
    this.assertCanTarget(user, input.audience, input.targetFloor);
    const notice = await noticeRepository.create({
      ...input,
      targetFloor: input.audience === 'FLOOR' ? input.targetFloor : null,
      pdfUrl: await this.uploadPdf(file),
      createdBy: user.userId,
      createdByRole: user.role as UserRole,
    });

    // In-app only: email to the whole hall would exhaust the free email quota
    const audience = await notificationRepository.findAudience(notice.targetFloor ?? undefined);
    await notificationService.notify(
      audience.filter((id) => id !== user.userId),
      {
        type: 'NOTICE_PUBLISHED',
        title: notice.priority === 'URGENT' ? `Urgent: ${notice.title}` : notice.title,
        message: notice.content.slice(0, 160),
        entityType: 'Notice',
        entityId: notice.id,
      },
    );
    return notice;
  }

  async list(user: JWTPayload, limit: number, cursor?: string) {
    const rows = await noticeRepository.listVisible(
      await this.scopeFor(user),
      limit,
      decodeCursor(cursor),
    );
    return toPage(rows, limit);
  }

  async get(user: JWTPayload, id: string) {
    const notice = await noticeRepository.findVisibleById(id, await this.scopeFor(user));
    if (!notice) throw new NotFoundError('Notice not found');
    return notice;
  }

  /** Author or the hall's top admins. Anyone else gets 404, not a hint it exists. */
  private async findEditable(user: JWTPayload, id: string) {
    const notice = await noticeRepository.findById(id);
    if (!notice || (notice.createdBy !== user.userId && !HALL_WIDE_ROLES.includes(user.role))) {
      throw new NotFoundError('Notice not found');
    }
    return notice;
  }

  async update(user: JWTPayload, id: string, input: UpdateNoticeInput, file?: Express.Multer.File) {
    const notice = await this.findEditable(user, id);
    const audience = input.audience ?? notice.audience;
    const targetFloor = audience === 'FLOOR' ? (input.targetFloor ?? notice.targetFloor) : null;
    this.assertCanTarget(user, audience, targetFloor);
    const pdfUrl = await this.uploadPdf(file);
    return noticeRepository.update(id, { ...input, targetFloor, ...(pdfUrl && { pdfUrl }) });
  }

  /** Withdrawn, not deleted: a notice that was published stays on record. */
  async withdraw(user: JWTPayload, id: string) {
    await this.findEditable(user, id);
    await noticeRepository.update(id, { isActive: false });
  }
}

export default new NoticeService();
