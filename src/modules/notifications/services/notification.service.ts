import { NotFoundError } from '@/shared/errors';
import emailService from '@/shared/utils/email/email.service';
import logger from '@/shared/utils/logger.util';
import notificationRepository from '../repositories/notification.repository';
import { NotificationInput } from '../types/notification.types';
import { decodeCursor, toPage } from '@/shared/utils/cursor.util';

class NotificationService {
  /**
   * Called by other modules after their own write has succeeded. A failed
   * notification must never undo or fail the action that caused it, so
   * errors are logged, not thrown.
   */
  async notify(userIds: string[], input: NotificationInput, options: { email?: boolean } = {}) {
    const recipients = [...new Set(userIds)];
    if (recipients.length === 0) return;
    try {
      await notificationRepository.createMany(recipients, input);
      if (options.email) {
        const contacts = await notificationRepository.findContacts(recipients);
        await Promise.all(
          contacts.map((c) =>
            emailService.sendNotificationEmail(c.email, c.name, input.title, input.message),
          ),
        );
      }
    } catch (error) {
      logger.error(`Notification "${input.type}" failed`, { error });
    }
  }

  /** New request from a student: the provost and her floor's house tutor. */
  async notifyStaffOfStudent(studentId: string, input: NotificationInput) {
    await this.notify(await notificationRepository.findStaffForStudent(studentId), input);
  }

  async list(userId: string, limit: number, cursor?: string) {
    return toPage(
      await notificationRepository.listForUser(userId, limit, decodeCursor(cursor)),
      limit,
    );
  }

  async unreadCount(userId: string) {
    return { count: await notificationRepository.countUnread(userId) };
  }

  async markRead(userId: string, id: string) {
    // 0 rows: not hers, already read, or missing. One answer for all three.
    if ((await notificationRepository.markRead(userId, id)) === 0) {
      throw new NotFoundError('Notification not found or already read');
    }
  }

  async markAllRead(userId: string) {
    return { updated: await notificationRepository.markAllRead(userId) };
  }
}

export default new NotificationService();
