import { prisma } from '@/database/prisma/client';
import { RoomType, Prisma, RoomStatus } from '@prisma/client';
import { RoomFilters, PaginationParams } from '../types/room.types';

class RoomRepository {
  // ============================================================================
  // CREATE
  // ============================================================================

  async create(data: Prisma.RoomCreateInput) {
    return await prisma.room.create({
      data,
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
    });
  }

  // ============================================================================
  // READ
  // ============================================================================

  async findById(roomId: string) {
    return await prisma.room.findUnique({
      where: { id: roomId },
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

    if (floor) where.floor = floor;
    if (roomType) where.roomType = roomType;
    if (status) where.status = status;
    if (search) {
      where.roomNumber = {
        contains: search,
        mode: 'insensitive',
      };
    }

    const skip = (page - 1) * limit;

    const [rooms, total] = await Promise.all([
      prisma.room.findMany({
        where,
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
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.room.count({ where }),
    ]);

    // Filter by vacancy in memory (more efficient than complex SQL)
    let filteredRooms = rooms;
    if (hasVacancy !== undefined) {
      filteredRooms = rooms.filter((room) => {
        const occupiedCount = room.occupants.filter((o) => o.userId !== null).length;
        const hasVacant = occupiedCount < room.capacity;
        return hasVacancy ? hasVacant : !hasVacant;
      });
    }

    return {
      rooms: filteredRooms,
      total: hasVacancy !== undefined ? filteredRooms.length : total,
    };
  }

  async findVacantRooms(floor?: number) {
    const where: Prisma.RoomWhereInput = {
      status: 'AVAILABLE',
    };

    if (floor) where.floor = floor;

    const rooms = await prisma.room.findMany({
      where,
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
      orderBy: [{ floor: 'asc' }, { roomNumber: 'asc' }],
    });

    // Filter rooms with vacant beds
    return rooms.filter((room) => {
      const occupiedCount = room.occupants.filter((o) => o.userId !== null).length;
      return occupiedCount < room.capacity;
    });
  }

  async findByFloor(floor: number) {
    return await prisma.room.findMany({
      where: { floor },
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
      orderBy: { roomNumber: 'asc' },
    });
  }

  async findByType(roomType: RoomType) {
    return await prisma.room.findMany({
      where: { roomType },
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
      orderBy: [{ floor: 'asc' }, { roomNumber: 'asc' }],
    });
  }

  // ============================================================================
  // UPDATE
  // ============================================================================

  async update(roomId: string, data: Prisma.RoomUpdateInput) {
    return await prisma.room.update({
      where: { id: roomId },
      data,
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

  async assignStudent(roomId: string, userId: string, bedNumber: number, assignedDate?: Date) {
    return await prisma.roomOccupant.create({
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
    });
  }

  async unassignStudent(roomId: string, userId: string) {
    return await prisma.roomOccupant.deleteMany({
      where: {
        roomId,
        userId,
      },
    });
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
