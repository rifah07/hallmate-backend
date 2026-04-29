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

  async upsertCancellation(data: {
    studentId: string;
    date: Date;
    breakfast?: boolean;
    lunch?: boolean;
    dinner?: boolean;
    reason?: string;
  }) {
    return prisma.mealCancellation.upsert({
      where: {
        studentId_date: {
          studentId: data.studentId,
          date: data.date,
        },
      },
      update: {
        ...(data.breakfast !== undefined && { breakfast: data.breakfast }),
        ...(data.lunch !== undefined && { lunch: data.lunch }),
        ...(data.dinner !== undefined && { dinner: data.dinner }),
        ...(data.reason !== undefined && { reason: data.reason }),
      },
      create: {
        studentId: data.studentId,
        date: data.date,
        breakfast: data.breakfast ?? false,
        lunch: data.lunch ?? false,
        dinner: data.dinner ?? false,
        reason: data.reason,
      },
    });
  }

  async updateCancellation(studentId: string, date: Date, data: any) {
    return prisma.mealCancellation.update({
      where: {
        studentId_date: { studentId, date },
      },
      data,
    });
  }

  async deleteCancellation(studentId: string, date: Date) {
    return prisma.mealCancellation.delete({
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

  async bulkUpsert(operations: any[]) {
    const batchSize = 50;
    let count = 0;

    for (let i = 0; i < operations.length; i += batchSize) {
      const batch = operations.slice(i, i + batchSize);
      await Promise.all(batch);
      count += batch.length;
    }

    return count;
  }
}

export default new MealCancellationRepository();
