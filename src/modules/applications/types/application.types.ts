// src/modules/applications/types/application.types.ts

import { ApplicationType, ApplicationStatus, UserRole } from '@prisma/client';

export interface CreateApplicationInput {
  type: ApplicationType;
  data: Record<string, any>;
  attachments?: string[];
}

export interface UpdateApplicationInput {
  data?: Record<string, any>;
  attachments?: string[];
}

export interface AssignApplicationInput {
  assignedTo: string;
  assignedToRole: UserRole;
}

export interface RespondToApplicationInput {
  status: ApplicationStatus;
  responseNote: string;
}

export interface ApplicationFilters {
  type?: ApplicationType;
  status?: ApplicationStatus;
  studentId?: string;
  assignedTo?: string;
  assignedToRole?: UserRole;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ApplicationResponse {
  id: string;
  type: ApplicationType;
  status: ApplicationStatus;
  studentId: string;
  student: {
    id: string;
    name: string;
    universityId: string;
    email: string;
    phone: string;
    department?: string;
    year?: number;
    currentRoomId?: string;
  };
  data: Record<string, any>;
  attachments: string[];
  assignedTo?: string;
  assignedToRole?: UserRole;
  assignedToUser?: {
    id: string;
    name: string;
    universityId: string;
    role: string;
  };
  responseNote?: string;
  respondedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginatedApplicationsResponse {
  applications: ApplicationResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApplicationStatistics {
  total: number;
  byStatus: {
    status: ApplicationStatus;
    count: number;
  }[];
  byType: {
    type: ApplicationType;
    count: number;
  }[];
  pending: number;
  approved: number;
  rejected: number;
  cancelled: number;
  avgResponseTime?: number; // in hours
}

export interface UserContext {
  userId: string;
  role: string;
  assignedFloor?: number | null;
}

export interface SeatApplicationData {
  roomPreference?: string; // roomType or specific room
  reason: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relation: string;
  };
}

export interface SeatCancellationData {
  reason: string;
  effectiveDate: Date;
  forwardingAddress?: string;
}

export interface SeatTransferData {
  currentRoomId: string;
  targetRoomId?: string;
  targetRoomType?: string;
  reason: string;
}

export interface SeatSwapData {
  currentRoomId: string;
  targetStudentId: string;
  targetRoomId: string;
  reason: string;
  targetStudentConsent: boolean;
}

export interface LeaveApplicationData {
  leaveType: string; // SHORT_LEAVE, LONG_LEAVE, etc.
  startDate: Date;
  endDate: Date;
  destination: string;
  reason: string;
  emergencyContact: {
    name: string;
    phone: string;
    relation: string;
  };
  guardianConsent?: boolean;
}

export interface ComplaintApplicationData {
  category: string;
  priority: string;
  title: string;
  description: string;
  location?: string;
  roomId?: string;
}

export interface MaintenanceApplicationData {
  category: string;
  priority: string;
  roomId?: string;
  location: string;
  description: string;
  preferredDate?: Date;
}
