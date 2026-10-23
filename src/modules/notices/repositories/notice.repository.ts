import { Prisma } from '@prisma/client';
import prisma from '@/config/database.config';
import { Cursor, olderThan } from '@/shared/utils/cursor.util';

/** Who sees what: the provost and super admin see every notice; others see
 *  hall-wide notices plus their own floor's. */
export type NoticeScope = { seeAll: true } | { seeAll: false; floor?: number };

const live = (): Prisma.NoticeWhereInput => ({
  isActive: true,
  OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
});

const inScope = (scope: NoticeScope): Prisma.NoticeWhereInput =>
  scope.seeAll
    ? {}
    : {
        OR: [
          { audience: 'ALL' },
          ...(scope.floor ? [{ audience: 'FLOOR' as const, targetFloor: scope.floor }] : []),
        ],
      };

class NoticeRepository {
  async create(data: Prisma.NoticeUncheckedCreateInput) {
    return prisma.notice.create({ data });
  }

  async update(id: string, data: Prisma.NoticeUncheckedUpdateInput) {
    return prisma.notice.update({ where: { id }, data });
  }

  async findById(id: string) {
    return prisma.notice.findUnique({ where: { id } });
  }

  /** Visible and live, newest first; urgent ones are just as new, the UI badges them. */
  async listVisible(scope: NoticeScope, limit: number, cursor?: Cursor) {
    return prisma.notice.findMany({
      where: { AND: [live(), inScope(scope), olderThan(cursor)] },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
    });
  }

  async findVisibleById(id: string, scope: NoticeScope) {
    return prisma.notice.findFirst({ where: { AND: [{ id }, live(), inScope(scope)] } });
  }
}

export default new NoticeRepository();
