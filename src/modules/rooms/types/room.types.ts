import { RoomType, RoomStatus } from '@prisma/client';

/**
 * Room Response DTO - sanitized data for API responses
 */
export interface RoomResponse {
  id: string;
  roomNumber: string;
  floor: number;
  type: RoomType;
  capacity: number;
  status: RoomStatus;
  hasAttachedBathroom: boolean;
  hasBalcony: boolean;
  currentOccupancy: number;
  createdAt: Date;
  updatedAt: Date;
  // Populated relations (optional)
  occupants?: OccupantResponse[];
}

/**
 * Occupant data in room responses
 */
export interface OccupantResponse {
  id: string;
  universityId: string;
  name: string;
  email: string;
  department?: string;
  year?: number;
  program?: string;
  profilePicture?: string;
}

export interface CreateRoomInput {
  roomNumber: string;
  floor: number;
  type: RoomType;
  capacity: number;
  hasAttachedBathroom?: boolean;
  hasBalcony?: boolean;
}

export interface UpdateRoomInput {
  roomNumber?: string;
  floor?: number;
  type?: RoomType;
  capacity?: number;
  status?: RoomStatus;
  hasAttachedBathroom?: boolean;
  hasBalcony?: boolean;
}

export interface RoomFilterOptions {
  floor?: number;
  type?: RoomType;
  status?: RoomStatus;
  hasAttachedBathroom?: boolean;
  hasBalcony?: boolean;
  minCapacity?: number;
  maxCapacity?: number;
  availableOnly?: boolean; // Rooms with currentOccupancy < capacity
}

export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface RoomListResponse {
  rooms: RoomResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface RoomStatistics {
  total: number;
  byStatus: {
    available: number;
    occupied: number;
    underMaintenance: number;
    reserved: number;
  };
  byType: {
    single: number;
    double: number;
    triple: number;
    quadruple: number;
  };
  byFloor: Record<number, number>; // { floor: count }
  occupancyRate: number; // Percentage
  totalCapacity: number;
  totalOccupied: number;
  availableCapacity: number;
}

export interface BulkCreateRoomsInput {
  rooms: CreateRoomInput[];
}

export interface BulkCreateResult {
  created: number;
  errors: Array<{
    roomNumber: string;
    error: string;
  }>;
}

export interface AssignUserToRoomInput {
  userId: string;
  roomId: string;
}

export interface RoomVacancyInfo {
  roomId: string;
  roomNumber: string;
  floor: number;
  type: RoomType;
  capacity: number;
  currentOccupancy: number;
  availableSpots: number;
  hasAttachedBathroom: boolean;
  hasBalcony: boolean;
}
