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