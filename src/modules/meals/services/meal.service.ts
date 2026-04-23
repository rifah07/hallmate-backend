import mealRepository from '../repositories/meal.repository';
import {
  UpdateMealInput,
  UserContext,
  MealLogResponse,
  BulkUpdateMealInput,
  MealFilters,
  PaginationParams,
} from '../types/meal.types';
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

  async bulkUpdateMealLogs(
    input: BulkUpdateMealInput,
    userContext: UserContext,
  ): Promise<MealLogResponse[]> {
    // Only dining staff and admins can bulk update
    if (
      userContext.role !== 'SUPER_ADMIN' &&
      userContext.role !== 'PROVOST' &&
      userContext.role !== 'DINING_STAFF'
    ) {
      throw new ForbiddenError('Only dining staff and admins can perform bulk updates');
    }

    const mealDate = typeof input.date === 'string' ? new Date(input.date) : input.date;

    // Validate date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    mealDate.setHours(0, 0, 0, 0);

    if (mealDate > today) {
      throw new BadRequestError('Cannot log meals for future dates');
    }

    // Verify all students exist and are active
    const students = await mealRepository.findStudentsByIds(input);

    if (students.length !== input.studentIds.length) {
      throw new BadRequestError('One or more students not found');
    }

    const invalidStudents = students.filter(
      (s) => s.role !== 'STUDENT' || s.accountStatus !== 'ACTIVE',
    );

    if (invalidStudents.length > 0) {
      throw new BadRequestError('All users must be active students');
    }

    const mealLogs = await mealRepository.bulkUpsertMealLogs({
      studentIds: input.studentIds,
      date: mealDate,
      breakfast: input.breakfast,
      lunch: input.lunch,
      dinner: input.dinner,
    });

    return mealLogs.map((log) => this.transformMealLog(log));
  }

  async getMealLogs(filters: MealFilters, pagination: PaginationParams, userContext: UserContext) {
    if (userContext.role === 'STUDENT') {
      filters.studentId = userContext.userId;
    }

    // House tutors can only see their floor
    if (userContext.role === 'HOUSE_TUTOR') {
      if (!userContext.assignedFloor) {
        throw new ForbiddenError('House Tutor must have an assigned floor');
      }
      filters.floor = userContext.assignedFloor;
    }

    const { mealLogs, total } = await mealRepository.findAll(filters, pagination);

    const page = pagination.page || 1;
    const limit = pagination.limit || 50;

    return {
      mealLogs: mealLogs.map((log) => this.transformMealLog(log)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getMealLogByDate(
    studentId: string,
    date: Date | string,
    userContext: UserContext,
  ): Promise<MealLogResponse | null> {
    const mealDate = typeof date === 'string' ? new Date(date) : date;
    mealDate.setHours(0, 0, 0, 0);

    if (userContext.role === 'STUDENT' && userContext.userId !== studentId) {
      throw new ForbiddenError('You can only view your own meal logs');
    }

    const mealLog = await mealRepository.findByStudentAndDate(studentId, mealDate);

    if (!mealLog) {
      return null;
    }

    if (userContext.role === 'HOUSE_TUTOR') {
      if (mealLog.student.currentRoom?.floor !== userContext.assignedFloor) {
        throw new ForbiddenError('You can only view meal logs for students on your floor');
      }
    }

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
