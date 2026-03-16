import { Room, RoomType, RoomStatus } from '@prisma/client';

// ============================================================================
// INPUT TYPES
// ============================================================================

export interface CreateRoomInput {
  roomNumber: string;
  floor: number;
  wing: 'A' | 'B';
  roomType: RoomType;
  capacity: number;
  status?: RoomStatus;
  hasAC?: boolean;
  hasBalcony?: boolean;
  hasAttachedBath?: boolean;
}

export interface UpdateRoomInput {
  roomNumber?: string;
  floor?: number;
  roomType?: RoomType;
  capacity?: number;
  status?: RoomStatus;
  hasAC?: boolean;
  hasBalcony?: boolean;
  hasAttachedBath?: boolean;
}

export interface AssignStudentInput {
  userId: string;
  bedNumber: number;
  assignedDate?: Date;
}

export interface UnassignStudentInput {
  userId: string;
  roomId: string;
}

export interface TransferStudentInput {
  userId: string;
  targetRoomId: string;
  targetBedNumber: number;
  transferDate?: Date;
  reason?: string;
}

// ============================================================================
// FILTER TYPES
// ============================================================================

export interface RoomFilters {
  floor?: number;
  roomType?: RoomType;
  status?: RoomStatus;
  hasVacancy?: boolean;
  search?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface GetRoomsQuery extends RoomFilters, PaginationParams {}

// ============================================================================
// RESPONSE TYPES
// ============================================================================

export interface OccupantInfo {
  id: string;
  name: string;
  universityId: string;
  email: string;
  phone: string;
  photo: string | null;
  bedNumber: number;
  assignedDate: Date;
}

export interface RoomWithOccupants extends Room {
  occupants: OccupantInfo[];
  vacantBeds: number[];
  occupancyRate: number;
}

export interface PaginatedRoomsResponse {
  rooms: RoomWithOccupants[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface FloorStatistics {
  floor: number;
  totalRooms: number;
  occupiedRooms: number;
  vacantRooms: number;
  totalBeds: number;
  occupiedBeds: number;
  vacantBeds: number;
  occupancyRate: number;
}

export interface TypeStatistics {
  type: RoomType;
  count: number;
  totalBeds: number;
  occupiedBeds: number;
  vacantBeds: number;
  occupancyRate: number;
}

export interface RoomStatistics {
  totalRooms: number;
  occupiedRooms: number;
  vacantRooms: number;
  maintenanceRooms: number;
  totalBeds: number;
  occupiedBeds: number;
  vacantBeds: number;
  overallOccupancyRate: number;
  byFloor: FloorStatistics[];
  byType: TypeStatistics[];
}

// ============================================================================
// USER CONTEXT
// ============================================================================

export interface UserContext {
  userId: string;
  role: string;
  assignedFloor?: number | null;
}
