import { prisma } from '@/database/prisma/client';
import { RoomType, Prisma } from '@prisma/client';
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
}

export default new RoomRepository();
