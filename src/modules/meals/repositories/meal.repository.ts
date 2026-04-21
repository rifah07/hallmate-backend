import prisma from '@/config/database.config';

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
}

export default new MealRepository();
