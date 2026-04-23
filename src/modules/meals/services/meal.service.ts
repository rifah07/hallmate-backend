import mealRepository from '../repositories/meal.repository';
import { UpdateMealInput, UserContext, MealLogResponse } from '../types/meal.types';
import { BadRequestError, ForbiddenError, NotFoundError } from '@/shared/errors';

class MealService {
  async updateMealLog(
    studentId: string,
    date: Date | string,
    input: UpdateMealInput,
    userContext: UserContext,
  ): Promise<MealLogResponse> {
    const mealDate = typeof date === 'string' ? new Date(date) : date;

    // Validate date is not in future
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    mealDate.setHours(0, 0, 0, 0);

    if (mealDate > today) {
      throw new BadRequestError('Cannot log meals for future dates');
    }

    const student = await mealRepository.findStudent(studentId);

    if (!student) {
      throw new NotFoundError('Student not found');
    }

    if (student.role !== 'STUDENT') {
      throw new BadRequestError('User is not a student');
    }

    if (student.accountStatus !== 'ACTIVE') {
      throw new BadRequestError('Student account is not active');
    }

    this.checkMealLogAccess(student, userContext);

    const mealLog = await mealRepository.upsertMealLog({
      studentId,
      date: mealDate,
      breakfast: input.breakfast,
      lunch: input.lunch,
      dinner: input.dinner,
    });

    return this.transformMealLog(mealLog);
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private transformMealLog(mealLog: any): MealLogResponse {
    return {
      id: mealLog.id,
      studentId: mealLog.studentId,
      student: mealLog.student,
      date: mealLog.date,
      breakfast: mealLog.breakfast,
      lunch: mealLog.lunch,
      dinner: mealLog.dinner,
      createdAt: mealLog.createdAt,
    };
  }

  private checkMealLogAccess(student: any, userContext: UserContext): void {
    // Admins and dining staff can update any meal log
    if (
      userContext.role === 'SUPER_ADMIN' ||
      userContext.role === 'PROVOST' ||
      userContext.role === 'DINING_STAFF'
    ) {
      return;
    }

    // House tutors can only update for their floor
    if (userContext.role === 'HOUSE_TUTOR') {
      if (!userContext.assignedFloor) {
        throw new ForbiddenError('House Tutor must have an assigned floor');
      }
      if (student.currentRoom?.floor !== userContext.assignedFloor) {
        throw new ForbiddenError('You can only update meal logs for students on your floor');
      }
      return;
    }

    // Students can only update their own logs
    if (userContext.role === 'STUDENT') {
      if (student.id !== userContext.userId) {
        throw new ForbiddenError('You can only update your own meal logs');
      }
      return;
    }

    throw new ForbiddenError('You do not have permission to update meal logs');
  }
}

export default new MealService();
