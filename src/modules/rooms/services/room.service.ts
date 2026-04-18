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
import { RoomStatus, RoomType } from '@prisma/client';

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
    this.checkFloorAccess(floor, userContext);

    const rooms = await roomRepository.findByFloor(floor);
    return rooms.map((room) => this.transformRoom(room));
  }

  async getMyRoom(studentId: string): Promise<RoomWithOccupants & { myBedNumber: number }> {
    const occupant = await roomRepository.findUserCurrentRoomAndBed(studentId);

    if (!occupant) {
      throw new NotFoundError('You are not currently assigned to any room');
    }

    const transformed = this.transformRoom(occupant.room);

    return {
      ...transformed,
      myBedNumber: occupant.bedNumber,
    };
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

  async deleteRoom(roomId: string) {
    const room = await roomRepository.findById(roomId);

    if (!room) {
      throw new NotFoundError('Room not found');
    }

    // const occupiedCount = room.occupants.filter((o) => o.userId !== null).length;
    const occupiedCount = room.occupants.filter((o) => !!o.userId).length;
    if (occupiedCount > 0) {
      throw new BadRequestError('Cannot delete room with occupants. Unassign all students first.');
    }

    await roomRepository.delete(roomId);
  }

  // ============================================================================
  // ASSIGN STUDENT
  // ============================================================================

  async assignStudent(roomId: string, data: AssignStudentInput, userContext: UserContext) {
    const room = await roomRepository.findById(roomId);

    if (!room) {
      throw new NotFoundError('Room not found');
    }

    this.checkFloorAccess(room.floor, userContext);

    if (room.status !== 'AVAILABLE') {
      throw new BadRequestError(
        `Room is currently ${room.status.toLowerCase()} and cannot accept new occupants`,
      );
    }

    if (data.bedNumber < 1 || data.bedNumber > room.capacity) {
      throw new BadRequestError(`Bed number must be between 1 and ${room.capacity}`);
    }

    const bedOccupant = await roomRepository.findOccupantByRoomAndBed(roomId, data.bedNumber);
    if (bedOccupant) {
      throw new ConflictError(`Bed ${data.bedNumber} is already occupied`);
    }

    const existingAssignment = await roomRepository.findOccupantByUserAndRoom(data.userId, roomId);
    if (existingAssignment) {
      throw new ConflictError('Student is already assigned to this room');
    }

    const currentRoom = await roomRepository.findUserCurrentRoom(data.userId);
    if (currentRoom) {
      throw new ConflictError(
        `Student is already assigned to room ${currentRoom.room.roomNumber}. Use transfer instead.`,
      );
    }

    const occupiedCount = room.occupants.filter((o) => o.userId !== null).length;
    if (occupiedCount >= room.capacity) {
      throw new BadRequestError('Room is full');
    }

    const newOccupancy = occupiedCount + 1;
    const newStatus: RoomStatus = newOccupancy >= room.capacity ? 'OCCUPIED' : 'PARTIALLY_OCCUPIED';

    await roomRepository.assignStudent(
      roomId,
      data.userId,
      data.bedNumber,
      newStatus,
      data.assignedDate,
    );

    const updatedRoom = await roomRepository.findById(roomId);
    return this.transformRoom(updatedRoom!);
  }

  // ============================================================================
  // UNASSIGN STUDENT
  // ============================================================================

  async unassignStudent(roomId: string, userId: string, userContext: UserContext) {
    const room = await roomRepository.findById(roomId);

    if (!room) {
      throw new NotFoundError('Room not found');
    }

    this.checkFloorAccess(room.floor, userContext);

    const occupant = await roomRepository.findOccupantByUserAndRoom(userId, roomId);
    if (!occupant) {
      throw new NotFoundError('Student is not assigned to this room');
    }

    const occupiedCount = room.occupants.filter((o) => o.userId !== null).length;
    const newOccupancy = occupiedCount - 1;
    const newStatus: RoomStatus = newOccupancy === 0 ? 'AVAILABLE' : 'PARTIALLY_OCCUPIED';

    await roomRepository.unassignStudent(roomId, userId, newStatus);

    const updatedRoom = await roomRepository.findById(roomId);
    return this.transformRoom(updatedRoom!);
  }

  // ============================================================================
  // TRANSFER STUDENT
  // ============================================================================

  async transferStudent(roomId: string, data: TransferStudentInput, userContext: UserContext) {
    const [sourceRoom, targetRoom] = await Promise.all([
      roomRepository.findById(roomId),
      roomRepository.findById(data.targetRoomId),
    ]);

    if (!sourceRoom) {
      throw new NotFoundError('Source room not found');
    }

    if (!targetRoom) {
      throw new NotFoundError('Target room not found');
    }

    this.checkFloorAccess(sourceRoom.floor, userContext);
    this.checkFloorAccess(targetRoom.floor, userContext);

    const occupant = await roomRepository.findOccupantByUserAndRoom(data.userId, roomId);
    if (!occupant) {
      throw new NotFoundError('Student is not assigned to the source room');
    }

    // Target room must be AVAILABLE or PARTIALLY_OCCUPIED (not full, maintenance, etc.)
    if (
      targetRoom.status === 'OCCUPIED' ||
      targetRoom.status === 'MAINTENANCE' ||
      targetRoom.status === 'RESERVED'
    ) {
      throw new BadRequestError(
        `Target room is currently ${targetRoom.status.toLowerCase()} and cannot accept new occupants`,
      );
    }

    if (data.targetBedNumber < 1 || data.targetBedNumber > targetRoom.capacity) {
      throw new BadRequestError(`Bed number must be between 1 and ${targetRoom.capacity}`);
    }

    const targetBedOccupant = await roomRepository.findOccupantByRoomAndBed(
      data.targetRoomId,
      data.targetBedNumber,
    );
    if (targetBedOccupant) {
      throw new ConflictError(`Target bed ${data.targetBedNumber} is already occupied`);
    }

    const targetOccupiedCount = targetRoom.occupants.filter((o) => o.userId !== null).length;
    if (targetOccupiedCount >= targetRoom.capacity) {
      throw new BadRequestError('Target room is full');
    }

    // Calculate source room new status after student leaves
    const sourceOccupiedCount = sourceRoom.occupants.filter((o) => o.userId !== null).length;
    const sourceNewOccupancy = sourceOccupiedCount - 1;
    const sourceNewStatus: RoomStatus =
      sourceNewOccupancy === 0 ? 'AVAILABLE' : 'PARTIALLY_OCCUPIED';

    // Calculate target room new status after student arrives
    const targetNewOccupancy = targetOccupiedCount + 1;
    const targetNewStatus: RoomStatus =
      targetNewOccupancy >= targetRoom.capacity ? 'OCCUPIED' : 'PARTIALLY_OCCUPIED';

    await roomRepository.unassignStudent(roomId, data.userId, sourceNewStatus);
    await roomRepository.assignStudent(
      data.targetRoomId,
      data.userId,
      data.targetBedNumber,
      targetNewStatus,
      data.transferDate,
    );

    const updatedTargetRoom = await roomRepository.findById(data.targetRoomId);
    return this.transformRoom(updatedTargetRoom!);
  }

  // ============================================================================
  // GET STATISTICS
  // ============================================================================

  async getStatistics(userContext: UserContext): Promise<RoomStatistics> {
    const { rooms, occupants } = await roomRepository.getStatistics();

    // Filter by floor for House Tutors
    let filteredRooms = rooms;
    if (userContext.role === 'HOUSE_TUTOR') {
      if (!userContext.assignedFloor) {
        throw new ForbiddenError('House Tutor must have an assigned floor');
      }
      filteredRooms = rooms.filter((r) => r.floor === userContext.assignedFloor);
    }

    // Overall statistics
    const totalRooms = filteredRooms.length;
    const occupiedRooms = filteredRooms.filter((r) => {
      const roomOccupants = occupants.filter((o) => o.roomId === r.id && o.userId !== null);
      return roomOccupants.length > 0;
    }).length;
    const vacantRooms = totalRooms - occupiedRooms;
    const maintenanceRooms = filteredRooms.filter((r) => r.status === 'MAINTENANCE').length;

    const totalBeds = filteredRooms.reduce((sum, r) => sum + r.capacity, 0);
    const occupiedBeds = occupants.filter(
      (o) => o.userId !== null && filteredRooms.some((r) => r.id === o.roomId),
    ).length;
    const vacantBeds = totalBeds - occupiedBeds;
    const overallOccupancyRate = totalBeds > 0 ? (occupiedBeds / totalBeds) * 100 : 0;

    // By floor
    const floors = [...new Set(filteredRooms.map((r) => r.floor))].sort((a, b) => a - b);
    const byFloor: FloorStatistics[] = floors.map((floor) => {
      const floorRooms = filteredRooms.filter((r) => r.floor === floor);
      const floorTotalRooms = floorRooms.length;
      const floorOccupiedRooms = floorRooms.filter((r) => {
        const roomOccupants = occupants.filter((o) => o.roomId === r.id && o.userId !== null);
        return roomOccupants.length > 0;
      }).length;
      const floorVacantRooms = floorTotalRooms - floorOccupiedRooms;
      const floorTotalBeds = floorRooms.reduce((sum, r) => sum + r.capacity, 0);
      const floorOccupiedBeds = occupants.filter(
        (o) => o.userId !== null && floorRooms.some((r) => r.id === o.roomId),
      ).length;
      const floorVacantBeds = floorTotalBeds - floorOccupiedBeds;
      const floorOccupancyRate =
        floorTotalBeds > 0 ? (floorOccupiedBeds / floorTotalBeds) * 100 : 0;

      return {
        floor,
        totalRooms: floorTotalRooms,
        occupiedRooms: floorOccupiedRooms,
        vacantRooms: floorVacantRooms,
        totalBeds: floorTotalBeds,
        occupiedBeds: floorOccupiedBeds,
        vacantBeds: floorVacantBeds,
        occupancyRate: Math.round(floorOccupancyRate * 100) / 100,
      };
    });

    // By type
    const types: RoomType[] = ['SINGLE', 'DOUBLE', 'TRIPLE', 'FOUR_SHARING'];
    const byType: TypeStatistics[] = types.map((type) => {
      const typeRooms = filteredRooms.filter((r) => r.roomType === type);
      const count = typeRooms.length;
      const typeTotalBeds = typeRooms.reduce((sum, r) => sum + r.capacity, 0);
      const typeOccupiedBeds = occupants.filter(
        (o) => o.userId !== null && typeRooms.some((r) => r.id === o.roomId),
      ).length;
      const typeVacantBeds = typeTotalBeds - typeOccupiedBeds;
      const typeOccupancyRate = typeTotalBeds > 0 ? (typeOccupiedBeds / typeTotalBeds) * 100 : 0;

      return {
        type,
        count,
        totalBeds: typeTotalBeds,
        occupiedBeds: typeOccupiedBeds,
        vacantBeds: typeVacantBeds,
        occupancyRate: Math.round(typeOccupancyRate * 100) / 100,
      };
    });

    return {
      totalRooms,
      occupiedRooms,
      vacantRooms,
      maintenanceRooms,
      totalBeds,
      occupiedBeds,
      vacantBeds,
      overallOccupancyRate: Math.round(overallOccupancyRate * 100) / 100,
      byFloor,
      byType,
    };
  }
}

export default new RoomService();
