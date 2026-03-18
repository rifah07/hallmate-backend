import roomRepository from '../repositories/room.repository';
import {
  CreateRoomInput,
  UpdateRoomInput,
  AssignStudentInput,
  TransferStudentInput,
  RoomFilters,
  PaginationParams,
  UserContext,
  RoomWithOccupants,
  OccupantInfo,
  RoomStatistics,
  FloorStatistics,
  TypeStatistics,
} from '../types/room.types';
import { NotFoundError, ConflictError, ForbiddenError, BadRequestError } from '@/shared/errors';
import { RoomType } from '@prisma/client';

class RoomService {
  // ============================================================================
  // HELPER: Apply floor restriction for House Tutors
  // ============================================================================

  private applyFloorRestriction(filters: RoomFilters, userContext: UserContext): RoomFilters {
    if (userContext.role === 'HOUSE_TUTOR') {
      if (!userContext.assignedFloor) {
        throw new ForbiddenError('House Tutor must have an assigned floor');
      }
      // Override floor filter for house tutors
      return { ...filters, floor: userContext.assignedFloor };
    }
    return filters;
  }

  // ============================================================================
  // HELPER: Check floor access
  // ============================================================================

  private checkFloorAccess(floor: number, userContext: UserContext): void {
    if (userContext.role === 'HOUSE_TUTOR') {
      if (!userContext.assignedFloor) {
        throw new ForbiddenError('House Tutor must have an assigned floor');
      }
      if (floor !== userContext.assignedFloor) {
        throw new ForbiddenError('House Tutors can only access rooms on their assigned floor');
      }
    }
  }

  // ============================================================================
  // HELPER: Transform room to include occupants and vacancy info
  // ============================================================================

  private transformRoom(room: any): RoomWithOccupants {
    const occupants: OccupantInfo[] = room.occupants
      .filter((o: any) => o.userId !== null)
      .map((o: any) => ({
        id: o.user.id,
        name: o.user.name,
        universityId: o.user.universityId,
        email: o.user.email,
        phone: o.user.phone,
        photo: o.user.photo,
        bedNumber: o.bedNumber,
        assignedDate: o.assignedDate,
      }));

    // Calculate vacant beds
    const occupiedBeds = occupants.map((o) => o.bedNumber);
    const allBeds = Array.from({ length: room.capacity }, (_, i) => i + 1);
    const vacantBeds = allBeds.filter((bed) => !occupiedBeds.includes(bed));

    // Calculate occupancy rate
    const occupancyRate = room.capacity > 0 ? (occupants.length / room.capacity) * 100 : 0;

    return {
      ...room,
      occupants,
      vacantBeds,
      occupancyRate: Math.round(occupancyRate * 100) / 100, // Round to 2 decimals
    };
  }

  async createRoom(data: CreateRoomInput) {
    const existing = await roomRepository.findByRoomNumber(data.roomNumber);
    if (existing) {
      throw new ConflictError(`Room ${data.roomNumber} already exists`);
    }

    // Validate capacity matches room type
    const expectedCapacity = {
      SINGLE: 1,
      DOUBLE: 2,
      TRIPLE: 3,
      FOUR_SHARING: 4,
    };

    if (data.capacity !== expectedCapacity[data.roomType]) {
      throw new BadRequestError(
        `Capacity must be ${expectedCapacity[data.roomType]} for ${data.roomType} room type`,
      );
    }

    const room = await roomRepository.create({
      roomNumber: data.roomNumber,
      floor: data.floor,
      wing: data.wing,
      roomType: data.roomType,
      capacity: data.capacity,
      status: data.status || 'AVAILABLE',
      hasAC: data.hasAC || false,
      hasBalcony: data.hasBalcony || false,
      hasAttachedBath: data.hasAttachedBath || false,
    });

    return this.transformRoom(room);
  }

  async getRooms(filters: RoomFilters, pagination: PaginationParams, userContext: UserContext) {
    // Apply floor restriction for House Tutors
    const adjustedFilters = this.applyFloorRestriction(filters, userContext);

    const { rooms, total } = await roomRepository.findAll(adjustedFilters, pagination);

    const transformedRooms = rooms.map((room) => this.transformRoom(room));

    const { page = 1, limit = 20 } = pagination;
    const totalPages = Math.ceil(total / limit);

    return {
      rooms: transformedRooms,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  async getVacantRooms(floor: number | undefined, userContext: UserContext) {
    // Apply floor restriction
    if (userContext.role === 'HOUSE_TUTOR') {
      if (!userContext.assignedFloor) {
        throw new ForbiddenError('House Tutor must have an assigned floor');
      }
      floor = userContext.assignedFloor;
    }

    const rooms = await roomRepository.findVacantRooms(floor);
    return rooms.map((room) => this.transformRoom(room));
  }

  async getMyFloorRooms(userContext: UserContext) {
    if (userContext.role !== 'HOUSE_TUTOR') {
      throw new ForbiddenError('This endpoint is only for House Tutors');
    }

    if (!userContext.assignedFloor) {
      throw new ForbiddenError('House Tutor must have an assigned floor');
    }

    const rooms = await roomRepository.findByFloor(userContext.assignedFloor);
    return rooms.map((room) => this.transformRoom(room));
  }

  async getRoomsByFloor(floor: number, userContext: UserContext) {
    // Check access
    this.checkFloorAccess(floor, userContext);

    const rooms = await roomRepository.findByFloor(floor);
    return rooms.map((room) => this.transformRoom(room));
  }

  async getRoomsByType(roomType: RoomType, userContext: UserContext) {
    const rooms = await roomRepository.findByType(roomType);

    let filteredRooms = rooms;
    if (userContext.role === 'HOUSE_TUTOR') {
      if (!userContext.assignedFloor) {
        throw new ForbiddenError('House Tutor must have an assigned floor');
      }
      filteredRooms = rooms.filter((room) => room.floor === userContext.assignedFloor);
    }

    return filteredRooms.map((room) => this.transformRoom(room));
  }

  async getRoomById(roomId: string, userContext: UserContext) {
    const room = await roomRepository.findById(roomId);

    if (!room) {
      throw new NotFoundError('Room not found');
    }

    this.checkFloorAccess(room.floor, userContext);

    return this.transformRoom(room);
  }

  async updateRoom(roomId: string, data: UpdateRoomInput) {
    const room = await roomRepository.findById(roomId);

    if (!room) {
      throw new NotFoundError('Room not found');
    }

    // If updating room number, check uniqueness
    if (data.roomNumber && data.roomNumber !== room.roomNumber) {
      const existing = await roomRepository.findByRoomNumber(data.roomNumber);
      if (existing) {
        throw new ConflictError(`Room ${data.roomNumber} already exists`);
      }
    }

    // If updating capacity or room type, validate
    if (data.roomType || data.capacity) {
      const newRoomType = data.roomType || room.roomType;
      const newCapacity = data.capacity || room.capacity;

      const expectedCapacity = {
        SINGLE: 1,
        DOUBLE: 2,
        TRIPLE: 3,
        FOUR_SHARING: 4,
      };

      if (newCapacity !== expectedCapacity[newRoomType]) {
        throw new BadRequestError(
          `Capacity must be ${expectedCapacity[newRoomType]} for ${newRoomType} room type`,
        );
      }

      // Check if reducing capacity would leave students without beds
      const occupiedCount = room.occupants.filter((o) => o.userId !== null).length;
      if (newCapacity < occupiedCount) {
        throw new BadRequestError(
          `Cannot reduce capacity below ${occupiedCount}. Room currently has ${occupiedCount} occupants.`,
        );
      }
    }

    const updated = await roomRepository.update(roomId, data);
    return this.transformRoom(updated);
  }

  // ============================================================================
  // DELETE ROOM
  // ============================================================================

  async deleteRoom(roomId: string) {
    const room = await roomRepository.findById(roomId);

    if (!room) {
      throw new NotFoundError('Room not found');
    }

    // Check if room has occupants
    const occupiedCount = room.occupants.filter((o) => o.userId !== null).length;
    if (occupiedCount > 0) {
      throw new BadRequestError('Cannot delete room with occupants. Unassign all students first.');
    }

    await roomRepository.delete(roomId);
  }
}

export default new RoomService();
