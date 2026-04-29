import prisma from '@/config/database.config';

class MealCancellationRepository {
  async findStudent(studentId: string) {
    return prisma.user.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        role: true,
        accountStatus: true,
        name: true,
        currentRoomId: true,
        currentRoom: {
          select: { floor: true },
        },
      },
    });
  }

  // ============================================================================
  // CANCELLATION CRUD
  // ============================================================================

  async findCancellation(studentId: string, date: Date) {
    return prisma.mealCancellation.findUnique({
      where: {
        studentId_date: { studentId, date },
      },
    });
  }

  async findCancellationsByRange(studentId: string, dateFrom: Date, dateTo: Date) {
    return prisma.mealCancellation.findMany({
      where: {
        studentId,
        date: {
          gte: dateFrom,
          lte: dateTo,
        },
      },
    });
  }

  async findByDate(date: Date) {
    return prisma.mealCancellation.findMany({
      where: { date },
      include: {
        student: {
          select: {
            currentRoom: {
              select: { floor: true },
            },
          },
        },
      },
    });
  }

  async countActiveStudentsWithRooms() {
    return prisma.user.count({
      where: {
        role: 'STUDENT',
        accountStatus: 'ACTIVE',
        currentRoomId: { not: null },
      },
    });
  }
}

export default new MealCancellationRepository();
