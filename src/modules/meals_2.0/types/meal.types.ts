/**
 * SYSTEM DESIGN: DEFAULT-ON MEAL SYSTEM
 *
 * Business Logic:
 * - All students get meals by default
 * - Students cancel meals they won't eat
 * - Kitchen staff sets cancellation deadline (default: 1 day before)
 * - Students can cancel multiple days at once
 * - Cannot cancel past meals
 */

// ============================================================================
// MEAL CANCELLATION
// ============================================================================

export interface MealCancellation {
  id: string;
  studentId: string;
  date: Date;
  breakfast: boolean;
  lunch: boolean;
  dinner: boolean;
  cancelledAt: Date;
  reason?: string;
}

export interface CancelMealInput {
  dates: string[]; // Array of dates to cancel: ["2026-04-25", "2026-04-26"]
  mealTypes: ('breakfast' | 'lunch' | 'dinner')[];
  reason?: string;
}

export interface CancellationResponse {
  successful: {
    date: string;
    meals: string[];
  }[];
  failed: {
    date: string;
    reason: string;
  }[];
  totalProcessed: number;
}

// ============================================================================
// DEFAULT MEAL CALCULATION
// ============================================================================

export interface StudentMealStatus {
  studentId: string;
  studentName: string;
  date: Date;
  meals: {
    breakfast: {
      active: boolean; // true = will receive meal, false = cancelled
      cancelled: boolean;
      cancellationDeadline?: Date;
    };
    lunch: {
      active: boolean;
      cancelled: boolean;
      cancellationDeadline?: Date;
    };
    dinner: {
      active: boolean;
      cancelled: boolean;
      cancellationDeadline?: Date;
    };
  };
}
