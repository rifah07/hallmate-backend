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

// ============================================================================
// RESPONSE TYPES
// ============================================================================

export interface MealLogResponse {
  id: string;
  studentId: string;
  student: {
    id: string;
    name: string;
    universityId: string;
    email: string;
    department?: string;
    year?: number;
    currentRoomId?: string;
    currentRoom?: {
      roomNumber: string;
      floor: number;
    };
  };
  date: Date;
  breakfast: boolean;
  lunch: boolean;
  dinner: boolean;
  createdAt: Date;
}

export interface PaginatedMealLogsResponse {
  mealLogs: MealLogResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface MealStatistics {
  date: Date;
  totalStudents: number;
  breakfast: {
    count: number;
    percentage: number;
  };
  lunch: {
    count: number;
    percentage: number;
  };
  dinner: {
    count: number;
    percentage: number;
  };
  byFloor?: {
    floor: number;
    breakfast: number;
    lunch: number;
    dinner: number;
    total: number;
  }[];
}

export interface MonthlyMealSummary {
  studentId: string;
  studentName: string;
  universityId: string;
  month: number;
  year: number;
  totalDays: number;
  breakfastCount: number;
  lunchCount: number;
  dinnerCount: number;
  totalMeals: number;
}

export interface StudentMealHistory {
  studentId: string;
  studentName: string;
  universityId: string;
  dateFrom: Date;
  dateTo: Date;
  logs: {
    date: Date;
    breakfast: boolean;
    lunch: boolean;
    dinner: boolean;
  }[];
  summary: {
    totalDays: number;
    breakfastCount: number;
    lunchCount: number;
    dinnerCount: number;
    totalMeals: number;
  };
}

// ============================================================================
// USER CONTEXT
// ============================================================================

export interface UserContext {
  userId: string;
  role: string;
  assignedFloor?: number | null;
}
