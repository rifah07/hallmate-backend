import { prisma } from '@/config/database.config';
import { RoomType, Prisma, RoomStatus } from '@prisma/client';
import { RoomFilters, PaginationParams } from '../types/room.types';

const OCCUPANTS_INCLUDE = {
  occupants: {
    include: {
      user: {
        select: {
          id: true,
          name: true,
          universityId: true,
          email: true,
          phone: true,
          photo: true,
        },
      },
    },
  },
} as const;
class RoomRepository {
  // ============================================================================
  // CREATE
  // ============================================================================

  async create(data: Prisma.RoomCreateInput) {
    return await prisma.room.create({
      data,
      include: OCCUPANTS_INCLUDE,
    });
  }

  // ============================================================================
  // READ
  // ============================================================================

  async findById(roomId: string) {
    return await prisma.room.findUnique({
      where: { id: roomId },
      include: OCCUPANTS_INCLUDE,
    });
  }

  async findByRoomNumber(roomNumber: string) {
    return await prisma.room.findUnique({
      where: { roomNumber },
    });
  }

  async findAll(filters: RoomFilters, pagination: PaginationParams) {
    const { page = 1, limit = 20, sortBy = 'roomNumber', sortOrder = 'asc' } = pagination;
    const { floor, roomType, status, hasVacancy, search } = filters;

    const where: Prisma.RoomWhereInput = {};

    if (floor !== undefined) where.floor = floor;
    if (roomType) where.roomType = roomType;
    if (status) where.status = status;
    if (search) {
      where.roomNumber = { contains: search, mode: 'insensitive' };
    }

    // DB-level vacancy filter using synced status field
    if (hasVacancy === true) {
      where.status = { in: ['AVAILABLE', 'PARTIALLY_OCCUPIED'] };
    }
    if (hasVacancy === false) {
      where.status = 'OCCUPIED';
    }

    const skip = (page - 1) * limit;

    const [rooms, total] = await Promise.all([
      prisma.room.findMany({
        where,
        include: OCCUPANTS_INCLUDE,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.room.count({ where }),
    ]);

    return { rooms, total };
  }

  async findVacantRooms(floor?: number) {
    const where: Prisma.RoomWhereInput = {
      status: { in: ['AVAILABLE', 'PARTIALLY_OCCUPIED'] },
    };

    if (floor !== undefined) where.floor = floor;

    return await prisma.room.findMany({
      where,
      include: OCCUPANTS_INCLUDE,
      orderBy: [{ floor: 'asc' }, { roomNumber: 'asc' }],
    });
  }

  async findByFloor(floor: number) {
    return await prisma.room.findMany({
      where: { floor },
      include: OCCUPANTS_INCLUDE,
      orderBy: { roomNumber: 'asc' },
    });
  }

  async findByType(roomType: RoomType) {
    return await prisma.room.findMany({
      where: { roomType },
      include: OCCUPANTS_INCLUDE,
      orderBy: [{ floor: 'asc' }, { roomNumber: 'asc' }],
    });
  }

  async findRoomWithFilteredOccupant(roomId: string, studentId: string) {
    return await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        occupants: {
          where: { userId: studentId },
        },
      },
    });
  }

  // ============================================================================
  // UPDATE
  // ============================================================================

  async update(roomId: string, data: Prisma.RoomUpdateInput) {
    return await prisma.room.update({
      where: { id: roomId },
      data,
      include: OCCUPANTS_INCLUDE,
    });
  }

  // ============================================================================
  // DELETE
  // ============================================================================

  async delete(roomId: string) {
    return await prisma.room.delete({
      where: { id: roomId },
    });
  }

  // ============================================================================
  // OCCUPANT MANAGEMENT
  // ============================================================================

  async assignStudent(
    roomId: string,
    userId: string,
    bedNumber: number,
    newStatus: RoomStatus,
    assignedDate?: Date,
  ) {
    const [occupant] = await prisma.$transaction([
      prisma.roomOccupant.create({
        data: {
          roomId,
          userId,
          bedNumber,
          assignedDate: assignedDate || new Date(),
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              universityId: true,
              email: true,
              phone: true,
              photo: true,
            },
          },
          room: true,
        },
      }),
      prisma.room.update({
        where: { id: roomId },
        data: { currentOccupancy: { increment: 1 }, status: newStatus },
      }),
      // Kept in the same transaction: floor checks read user.currentRoom
      prisma.user.update({ where: { id: userId }, data: { currentRoomId: roomId } }),
    ]);

    return occupant;
  }

  async unassignStudent(roomId: string, userId: string, newStatus: RoomStatus) {
    const [result] = await prisma.$transaction([
      prisma.roomOccupant.deleteMany({
        where: { roomId, userId },
      }),
      prisma.room.update({
        where: { id: roomId },
        data: { currentOccupancy: { decrement: 1 }, status: newStatus },
      }),
      prisma.user.update({ where: { id: userId }, data: { currentRoomId: null } }),
    ]);

    return result;
  }

  /**
   * Move one student in a single transaction: if the new bed is taken in
   * the meantime, nothing changes and she keeps her old bed.
   */
  async transferStudent(move: {
    userId: string;
    fromRoomId: string;
    fromStatus: RoomStatus;
    toRoomId: string;
    toBed: number;
    toStatus: RoomStatus;
    date?: Date;
  }) {
    await prisma.$transaction([
      prisma.roomOccupant.deleteMany({ where: { roomId: move.fromRoomId, userId: move.userId } }),
      prisma.room.update({
        where: { id: move.fromRoomId },
        data: { currentOccupancy: { decrement: 1 }, status: move.fromStatus },
      }),
      prisma.roomOccupant.create({
        data: {
          roomId: move.toRoomId,
          userId: move.userId,
          bedNumber: move.toBed,
          assignedDate: move.date ?? new Date(),
        },
      }),
      prisma.room.update({
        where: { id: move.toRoomId },
        data: { currentOccupancy: { increment: 1 }, status: move.toStatus },
      }),
      prisma.user.update({ where: { id: move.userId }, data: { currentRoomId: move.toRoomId } }),
    ]);
  }

  /**
   * Two students trade beds. Delete both rows, then recreate them swapped:
   * updating in place would collide with the unique (room, bed) and
   * (user) indexes halfway through. Occupancy counts don't change.
   */
  async swapStudents(a: { userId: string; roomId: string; bed: number }, b: typeof a) {
    await prisma.$transaction([
      prisma.roomOccupant.deleteMany({ where: { userId: { in: [a.userId, b.userId] } } }),
      prisma.roomOccupant.createMany({
        data: [
          { userId: a.userId, roomId: b.roomId, bedNumber: b.bed },
          { userId: b.userId, roomId: a.roomId, bedNumber: a.bed },
        ],
      }),
      prisma.user.update({ where: { id: a.userId }, data: { currentRoomId: b.roomId } }),
      prisma.user.update({ where: { id: b.userId }, data: { currentRoomId: a.roomId } }),
    ]);
  }

  async findOccupantByRoomAndBed(roomId: string, bedNumber: number) {
    return await prisma.roomOccupant.findFirst({
      where: {
        roomId,
        bedNumber,
      },
    });
  }

  async findOccupantByUserAndRoom(userId: string, roomId: string) {
    return await prisma.roomOccupant.findFirst({
      where: {
        userId,
        roomId,
      },
    });
  }

  async findUserCurrentRoom(userId: string) {
    return await prisma.roomOccupant.findFirst({
      where: { userId },
      include: {
        room: true,
      },
    });
  }

  async findUserCurrentRoomAndBed(studentId: string) {
    return await prisma.roomOccupant.findFirst({
      where: { userId: studentId },
      include: {
        room: {
          include: {
            occupants: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    universityId: true,
                    email: true,
                    phone: true,
                    photo: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  // ============================================================================
  // STATISTICS
  // ============================================================================

  async getStatistics() {
    const [rooms, occupants] = await Promise.all([
      prisma.room.findMany({
        select: {
          id: true,
          floor: true,
          roomType: true,
          capacity: true,
          status: true,
        },
      }),
      prisma.roomOccupant.findMany({
        select: {
          roomId: true,
          userId: true,
        },
      }),
    ]);

    return { rooms, occupants };
  }

  async countByStatus(status: RoomStatus) {
    return await prisma.room.count({
      where: { status },
    });
  }

  async countTotal() {
    return await prisma.room.count();
  }
}

export default new RoomRepository();
