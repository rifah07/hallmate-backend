import prisma from '@/config/database.config';
import {
  BulkUpdateMealInput,
  MealFilters,
  PaginationParams,
  UserContext,
} from '../types/meal.types';
import { Prisma } from '@prisma/client';

class MealRepository {
  async upsertMealLog(data: {
    studentId: string;
    date: Date;
    breakfast?: boolean;
    lunch?: boolean;
    dinner?: boolean;
  }) {
    return await prisma.mealLog.upsert({
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
      },
      create: {
        studentId: data.studentId,
        date: data.date,
        breakfast: data.breakfast ?? false,
        lunch: data.lunch ?? false,
        dinner: data.dinner ?? false,
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            universityId: true,
            email: true,
            department: true,
            year: true,
            currentRoomId: true,
            currentRoom: {
              select: {
                roomNumber: true,
                floor: true,
              },
            },
          },
        },
      },
    });
  }

  async bulkUpsertMealLogs(data: {
    studentIds: string[];
    date: Date;
    breakfast?: boolean;
    lunch?: boolean;
    dinner?: boolean;
  }) {
    const operations = data.studentIds.map((studentId) =>
      this.upsertMealLog({
        studentId,
        date: data.date,
        breakfast: data.breakfast,
        lunch: data.lunch,
        dinner: data.dinner,
      }),
    );

    return await Promise.all(operations);
  }

  async findStudentHistory(studentId: string, dateFrom: Date, dateTo: Date) {
    return await prisma.mealLog.findMany({
      where: {
        studentId,
        date: {
          gte: dateFrom,
          lte: dateTo,
        },
      },
      orderBy: {
        date: 'asc',
      },
    });
  }

  async findByStudentAndDate(studentId: string, date: Date) {
    return await prisma.mealLog.findUnique({
      where: {
        studentId_date: {
          studentId,
          date,
        },
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            universityId: true,
            email: true,
            department: true,
            year: true,
            currentRoomId: true,
            currentRoom: {
              select: {
                roomNumber: true,
                floor: true,
              },
            },
          },
        },
      },
    });
  }

  async findAll(filters: MealFilters, pagination: PaginationParams) {
    const where: Prisma.MealLogWhereInput = {};

    if (filters.studentId) {
      where.studentId = filters.studentId;
    }

    if (filters.date) {
      where.date = filters.date;
    }

    if (filters.dateFrom || filters.dateTo) {
      where.date = {};
      if (filters.dateFrom) {
        where.date.gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        where.date.lte = filters.dateTo;
      }
    }

    if (filters.breakfast !== undefined) {
      where.breakfast = filters.breakfast;
    }

    if (filters.lunch !== undefined) {
      where.lunch = filters.lunch;
    }

    if (filters.dinner !== undefined) {
      where.dinner = filters.dinner;
    }

    if (filters.floor !== undefined) {
      where.student = {
        currentRoom: {
          floor: filters.floor,
        },
      };
    }

    if (filters.roomNumber) {
      where.student = {
        ...where.student,
        currentRoom: {
          ...(where.student as any)?.currentRoom,
          roomNumber: filters.roomNumber,
        },
      };
    }

    const page = pagination.page || 1;
    const limit = pagination.limit || 50;
    const skip = (page - 1) * limit;

    const [mealLogs, total] = await Promise.all([
      prisma.mealLog.findMany({
        where,
        include: {
          student: {
            select: {
              id: true,
              name: true,
              universityId: true,
              email: true,
              department: true,
              year: true,
              currentRoomId: true,
              currentRoom: {
                select: {
                  roomNumber: true,
                  floor: true,
                },
              },
            },
          },
        },
        orderBy: {
          [pagination.sortBy || 'date']: pagination.sortOrder || 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.mealLog.count({ where }),
    ]);

    return {
      mealLogs,
      total,
    };
  }

  async findByDate(date: Date) {
    return await prisma.mealLog.findMany({
      where: { date },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            universityId: true,
            email: true,
            currentRoom: {
              select: {
                roomNumber: true,
                floor: true,
              },
            },
          },
        },
      },
    });
  }

  async findStudent(studentId: string) {
    return await prisma.user.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        role: true,
        accountStatus: true,
        currentRoomId: true,
        currentRoom: {
          select: {
            floor: true,
          },
        },
      },
    });
  }

  async findStudentsByIds(input: BulkUpdateMealInput) {
    return await prisma.user.findMany({
      where: {
        id: {
          in: input.studentIds,
        },
      },
      select: {
        id: true,
        role: true,
        accountStatus: true,
      },
    });
  }

  async findStudentDetails(userContext: UserContext) {
    return await prisma.user.findUnique({
      where: { id: userContext.userId },
      select: {
        name: true,
        universityId: true,
      },
    });
  }
  async delete(studentId: string, date: Date) {
    return await prisma.mealLog.delete({
      where: {
        studentId_date: {
          studentId,
          date,
        },
      },
    });
  }

  async getStatisticsByDate(date: Date) {
    const logs = await prisma.mealLog.findMany({
      where: { date },
      include: {
        student: {
          select: {
            currentRoom: {
              select: {
                floor: true,
              },
            },
          },
        },
      },
    });

    return logs;
  }
  async getMonthlyStatistics(studentId: string, month: number, year: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    return await prisma.mealLog.findMany({
      where: {
        studentId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        date: 'asc',
      },
    });
  }
  async getTotalStudentsWithRooms() {
    return await prisma.user.count({
      where: {
        role: 'STUDENT',
        accountStatus: 'ACTIVE',
        currentRoomId: {
          not: null,
        },
      },
    });
  }
}

export default new MealRepository();
