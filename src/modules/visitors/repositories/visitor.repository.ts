import { Prisma, VisitorStatus } from '@prisma/client';
import prisma from '@/config/database.config';
import { Cursor, olderThan } from '@/shared/utils/cursor.util';

// What staff need to find the student: name and room, never her phone or ID
const studentSummary = {
  select: {
    id: true,
    name: true,
    universityId: true,
    currentRoom: { select: { roomNumber: true, floor: true } },
  },
} satisfies Prisma.UserDefaultArgs;

class VisitorRepository {
  async create(data: Prisma.VisitorUncheckedCreateInput) {
    return prisma.visitor.create({ data });
  }

  async findById(id: string) {
    return prisma.visitor.findUnique({ where: { id }, include: { student: studentSummary } });
  }

  async listForStudent(studentId: string, limit: number, cursor?: Cursor) {
    return prisma.visitor.findMany({
      where: { studentId, ...olderThan(cursor) },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
    });
  }

  /** Pending requests, optionally for one floor (a house tutor's). */
  async listPending(floor?: number) {
    return prisma.visitor.findMany({
      where: { status: 'PENDING', ...(floor && { student: { currentRoom: { floor } } }) },
      orderBy: { visitDate: 'asc' },
      take: 100,
      include: { student: studentSummary },
    });
  }

  /** The guard's list: today's approved and arrived visitors. */
  async listForDay(day: Date) {
    return prisma.visitor.findMany({
      where: { visitDate: day, status: { in: ['APPROVED', 'CHECKED_IN', 'CHECKED_OUT'] } },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        name: true,
        relation: true,
        purpose: true,
        status: true,
        checkedInAt: true,
        checkedOutAt: true,
        student: studentSummary,
      },
    });
  }

  /**
   * Moves a visit from one status to the next only if it is still in the
   * expected one, so two guards (or a double tap) can't both check her in.
   */
  async transition(
    id: string,
    from: VisitorStatus[],
    data: Prisma.VisitorUncheckedUpdateManyInput & { status: VisitorStatus },
    extraWhere: Prisma.VisitorWhereInput = {},
  ): Promise<boolean> {
    const { count } = await prisma.visitor.updateMany({
      where: { id, status: { in: from }, ...extraWhere },
      data,
    });
    return count > 0;
  }
}

export default new VisitorRepository();
