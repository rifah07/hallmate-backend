import repository from '../repositories/meal-cancellation.repository';
import {
  CancelMealInput,
  CancellationResponse,
  MealPlanningReport,
  StudentMealStatus,
} from '../types/meal.types';
import { BadRequestError } from '@/shared/errors';

class MealCancellationService {
  private readonly MEAL_TIMES = {
    breakfast: 7,
    lunch: 13,
    dinner: 20,
  };

  private readonly DEADLINE_HOURS = 24;

  // ============================================================================
  // CANCEL
  // ============================================================================

  async cancelMeals(studentId: string, input: CancelMealInput): Promise<CancellationResponse> {
    const student = await repository.findStudent(studentId);

    if (!student || student.role !== 'STUDENT' || student.accountStatus !== 'ACTIVE') {
      throw new BadRequestError('Invalid student');
    }

    const result: CancellationResponse = {
      successful: [],
      failed: [],
      totalProcessed: input.dates.length,
    };

    const now = new Date();

    for (const dateStr of input.dates) {
      const date = new Date(dateStr);
      date.setHours(0, 0, 0, 0);

      try {
        this.validateCancellation(date, input.mealTypes, now);

        const existing = await repository.findCancellation(studentId, date);

        const data = {
          breakfast: input.mealTypes.includes('breakfast'),
          lunch: input.mealTypes.includes('lunch'),
          dinner: input.mealTypes.includes('dinner'),
          reason: input.reason,
        };

        await repository.upsertCancellation({
          studentId,
          date,
          breakfast: existing?.breakfast || data.breakfast,
          lunch: existing?.lunch || data.lunch,
          dinner: existing?.dinner || data.dinner,
          reason: input.reason ?? existing?.reason ?? undefined,
        });

        result.successful.push({ date: dateStr, meals: input.mealTypes });
      } catch (err: any) {
        result.failed.push({ date: dateStr, reason: err.message });
      }
    }

    return result;
  }

  // ============================================================================
  // REACTIVATE
  // ============================================================================

  async reactivateMeals(
    studentId: string,
    dates: string[],
    mealTypes: ('breakfast' | 'lunch' | 'dinner')[],
  ) {
    let count = 0;
    const now = new Date();

    for (const dateStr of dates) {
      const date = new Date(dateStr);
      date.setHours(0, 0, 0, 0);

      for (const meal of mealTypes) {
        if (now > this.getDeadline(date, meal)) {
          throw new BadRequestError(`Deadline passed for ${meal}`);
        }
      }

      const existing = await repository.findCancellation(studentId, date);
      if (!existing) continue;

      const updated = await repository.updateCancellation(studentId, date, {
        breakfast: existing.breakfast && !mealTypes.includes('breakfast'),
        lunch: existing.lunch && !mealTypes.includes('lunch'),
        dinner: existing.dinner && !mealTypes.includes('dinner'),
      });

      if (!updated.breakfast && !updated.lunch && !updated.dinner) {
        await repository.deleteCancellation(studentId, date);
      }

      count++;
    }

    return { reactivatedCount: count };
  }

  // ============================================================================
  // STATUS
  // ============================================================================

  async getStudentMealStatus(
    studentId: string,
    dateFrom: Date,
    dateTo: Date,
  ): Promise<StudentMealStatus[]> {
    const student = await repository.findStudent(studentId);
    if (!student) throw new BadRequestError('Student not found');

    const cancellations = await repository.findCancellationsByRange(studentId, dateFrom, dateTo);

    const map = new Map(cancellations.map((c) => [c.date.toISOString(), c]));

    const result: StudentMealStatus[] = [];
    const cur = new Date(dateFrom);

    while (cur <= dateTo) {
      const c = map.get(new Date(cur).toISOString());

      result.push({
        studentId,
        studentName: student.name,
        date: new Date(cur),
        meals: {
          breakfast: {
            active: !c?.breakfast,
            cancelled: !!c?.breakfast,
            cancellationDeadline: this.getDeadline(new Date(cur), 'breakfast'),
          },
          lunch: {
            active: !c?.lunch,
            cancelled: !!c?.lunch,
            cancellationDeadline: this.getDeadline(new Date(cur), 'lunch'),
          },
          dinner: {
            active: !c?.dinner,
            cancelled: !!c?.dinner,
            cancellationDeadline: this.getDeadline(new Date(cur), 'dinner'),
          },
        },
      });

      cur.setDate(cur.getDate() + 1);
    }

    return result;
  }

  // ============================================================================
  // REPORT
  // ============================================================================

  async getMealPlanningReport(date: Date): Promise<MealPlanningReport> {
    const mealDate = new Date(date);
    mealDate.setHours(0, 0, 0, 0);

    const totalStudents = await repository.countActiveStudentsWithRooms();
    const cancellations = await repository.findByDate(mealDate);

    const breakfastCancelled = cancellations.filter((c) => c.breakfast).length;
    const lunchCancelled = cancellations.filter((c) => c.lunch).length;
    const dinnerCancelled = cancellations.filter((c) => c.dinner).length;

    return {
      date: mealDate,
      breakfast: {
        totalStudents,
        activeMeals: totalStudents - breakfastCancelled,
        cancelled: breakfastCancelled,
        cancellationRate: (breakfastCancelled / totalStudents) * 100,
      },
      lunch: {
        totalStudents,
        activeMeals: totalStudents - lunchCancelled,
        cancelled: lunchCancelled,
        cancellationRate: (lunchCancelled / totalStudents) * 100,
      },
      dinner: {
        totalStudents,
        activeMeals: totalStudents - dinnerCancelled,
        cancelled: dinnerCancelled,
        cancellationRate: (dinnerCancelled / totalStudents) * 100,
      },
      byFloor: [],
    };
  }
  // ============================================================================
  // HELPERS
  // ============================================================================

  private validateCancellation(date: Date, mealTypes: string[], now: Date) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (date < today) {
      throw new BadRequestError('Cannot cancel past dates');
    }

    for (const meal of mealTypes) {
      if (now > this.getDeadline(date, meal as any)) {
        throw new BadRequestError(`Deadline passed for ${meal}`);
      }
    }
  }

  private getDeadline(date: Date, meal: 'breakfast' | 'lunch' | 'dinner') {
    const d = new Date(date);
    d.setHours(this.MEAL_TIMES[meal], 0, 0, 0);
    d.setHours(d.getHours() - this.DEADLINE_HOURS);
    return d;
  }
}

export default new MealCancellationService();
