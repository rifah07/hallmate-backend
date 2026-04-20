// ============================================================================
// INPUT TYPES
// ============================================================================

export interface UpdateMealInput {
  breakfast?: boolean;
  lunch?: boolean;
  dinner?: boolean;
}

export interface BulkUpdateMealInput {
  studentIds: string[];
  date: Date | string;
  breakfast?: boolean;
  lunch?: boolean;
  dinner?: boolean;
}

// ============================================================================
// FILTER & PAGINATION
// ============================================================================

export interface MealFilters {
  studentId?: string;
  date?: Date;
  dateFrom?: Date;
  dateTo?: Date;
  breakfast?: boolean;
  lunch?: boolean;
  dinner?: boolean;
  floor?: number;
  roomNumber?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}