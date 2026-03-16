import roomRepository from '../repositories/room.repository';
import { CreateRoomInput, RoomWithOccupants, OccupantInfo } from '../types/room.types';
import { ConflictError, BadRequestError } from '@/shared/errors';

class RoomService {
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

  // ============================================================================
  // CREATE ROOM
  // ============================================================================

  async createRoom(data: CreateRoomInput) {
    // Check if room number already exists
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
}

export default new RoomService();
