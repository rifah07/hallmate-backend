import prisma from '@/config/database.config';
import { NotificationInput } from '../types/notification.types';
import { Cursor, olderThan } from '@/shared/utils/cursor.util';

class NotificationRepository {
  async createMany(userIds: string[], input: NotificationInput): Promise<void> {
    await prisma.notification.createMany({
      data: userIds.map((userId) => ({
        userId,
        type: input.type,
        title: input.title,
        message: input.message,
        relatedEntityType: input.entityType,
        relatedEntityId: input.entityId,
      })),
    });
  }

  /**
   * Newest first, `limit + 1` rows so the caller knows if there is a next page.
   * Keyset pagination: "older than the last row I saw" stays fast at any depth,
   * unlike OFFSET, which reads and throws away every skipped row.
   */
  async listForUser(userId: string, limit: number, cursor?: Cursor) {
    return prisma.notification.findMany({
      where: { userId, ...olderThan(cursor) },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
      select: {
        id: true,
        type: true,
        title: true,
        message: true,
        relatedEntityType: true,
        relatedEntityId: true,
        isRead: true,
        createdAt: true,
      },
    });
  }

  async countUnread(userId: string): Promise<number> {
    return prisma.notification.count({ where: { userId, isRead: false } });
  }

  /** Scoped by userId, so nobody can mark someone else's notification. */
  async markRead(userId: string, id: string): Promise<number> {
    const { count } = await prisma.notification.updateMany({
      where: { id, userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
    return count;
  }

  async markAllRead(userId: string): Promise<number> {
    const { count } = await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
    return count;
  }

  /** The provost, plus the house tutor of the student's floor. */
  async findStaffForStudent(studentId: string): Promise<string[]> {
    const student = await prisma.user.findUnique({
      where: { id: studentId },
      select: { currentRoom: { select: { floor: true } } },
    });
    const floor = student?.currentRoom?.floor;
    const staff = await prisma.user.findMany({
      where: {
        isDeleted: false,
        accountStatus: 'ACTIVE',
        OR: [
          { role: 'PROVOST' },
          ...(floor ? [{ role: 'HOUSE_TUTOR' as const, assignedFloor: floor }] : []),
        ],
      },
      select: { id: true },
    });
    return staff.map((s) => s.id);
  }

  /** Everyone a notice reaches: all active users, or one floor's students and tutor. */
  async findAudience(floor?: number): Promise<string[]> {
    const users = await prisma.user.findMany({
      where: {
        isDeleted: false,
        accountStatus: 'ACTIVE',
        ...(floor && {
          OR: [
            { role: 'STUDENT', currentRoom: { floor } },
            { role: 'HOUSE_TUTOR', assignedFloor: floor },
          ],
        }),
      },
      select: { id: true },
    });
    return users.map((u) => u.id);
  }

  async findContacts(userIds: string[]) {
    return prisma.user.findMany({
      where: { id: { in: userIds }, isDeleted: false },
      select: { email: true, name: true },
    });
  }
}

export default new NotificationRepository();
