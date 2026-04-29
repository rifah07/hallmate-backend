// src/modules/meals/services/meal-cancellation.service.ts

import repository from '../repositories/meal-cancellation.repository';
import { CancelMealInput, CancellationResponse } from '../types/meal.types';
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
