import prisma from '@/config/database.config';

// Aggregates only: counts and sums computed by the database, never by
// loading rows into Node. `floor` narrows to one floor (a house tutor's).
const onFloor = (floor?: number) => (floor ? { currentRoom: { floor } } : {});

class DashboardRepository {
  async occupancy(floor?: number) {
    const { _sum } = await prisma.room.aggregate({
      where: floor ? { floor } : {},
      _sum: { capacity: true, currentOccupancy: true },
    });
    const beds = _sum.capacity ?? 0;
    const occupied = _sum.currentOccupancy ?? 0;
    return { beds, occupied, vacant: beds - occupied };
  }

  async pendingApplicationsByType(floor?: number) {
    const rows = await prisma.application.groupBy({
      by: ['type'],
      where: { status: 'PENDING', student: onFloor(floor) },
      _count: { _all: true },
    });
    return Object.fromEntries(rows.map((r) => [r.type, r._count._all]));
  }

  async pendingVisitors(floor?: number) {
    return prisma.visitor.count({ where: { status: 'PENDING', student: onFloor(floor) } });
  }

  async renewalCollection(period: string) {
    const rows = await prisma.bill.groupBy({
      by: ['status'],
      where: { type: 'SEAT_RENEWAL', period },
      _count: { _all: true },
      _sum: { amount: true },
    });
    const of = (status: string) => rows.find((r) => r.status === status);
    return {
      paid: of('PAID')?._count._all ?? 0,
      unpaid: of('UNPAID')?._count._all ?? 0,
      collected: of('PAID')?._sum.amount ?? 0,
      outstanding: of('UNPAID')?._sum.amount ?? 0,
    };
  }

  async visitorsForDay(day: Date) {
    const rows = await prisma.visitor.groupBy({
      by: ['status'],
      where: { visitDate: day, status: { in: ['APPROVED', 'CHECKED_IN', 'CHECKED_OUT'] } },
      _count: { _all: true },
    });
    const of = (status: string) => rows.find((r) => r.status === status)?._count._all ?? 0;
    return { expected: of('APPROVED'), inside: of('CHECKED_IN'), left: of('CHECKED_OUT') };
  }

  // ── a student's own view ──

  async myBed(studentId: string) {
    return prisma.roomOccupant.findUnique({
      where: { userId: studentId },
      select: {
        bedNumber: true,
        user: { select: { isDemo: true } },
        room: {
          select: {
            roomNumber: true,
            floor: true,
            wing: true,
            // Roommates by name only: no phone numbers on a dashboard
            occupants: {
              where: { userId: { not: studentId } },
              select: { bedNumber: true, user: { select: { name: true } } },
            },
          },
        },
      },
    });
  }

  // Whoever looks after the floor right now, so a move or a new tutor needs no edit.
  // Demo residents see the demo tutor; real residents never do.
  async floorTutor(floor: number, isDemo: boolean) {
    return prisma.user.findFirst({
      where: { role: 'HOUSE_TUTOR', assignedFloor: floor, accountStatus: 'ACTIVE', isDeleted: false, isDemo },
      select: { name: true, email: true, phone: true, photo: true },
    });
  }

  async myUnpaidBills(studentId: string) {
    const { _count, _sum } = await prisma.bill.aggregate({
      where: { studentId, status: 'UNPAID' },
      _count: { _all: true },
      _sum: { amount: true },
    });
    return { count: _count._all, total: _sum.amount ?? 0 };
  }

  async myPendingApplications(studentId: string) {
    return prisma.application.count({ where: { studentId, status: 'PENDING' } });
  }

  async myUpcomingVisitors(studentId: string, from: Date) {
    return prisma.visitor.count({
      where: { studentId, visitDate: { gte: from }, status: { in: ['PENDING', 'APPROVED'] } },
    });
  }
}

export default new DashboardRepository();
