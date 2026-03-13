import { prisma } from '@/database/prisma/client';
import { RoomType, RoomStatus, Prisma } from '@prisma/client';
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

}

export default new RoomRepository();
