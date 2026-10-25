import prisma from '@/config/database.config';
import { ApplicationType, ApplicationStatus, UserRole, Prisma } from '@prisma/client';
import { ApplicationFilters, PaginationParams } from '../types/application.types';

class ApplicationRepository {
  async create(data: {
    type: ApplicationType;
    studentId: string;
    data: Record<string, unknown>;
    attachments?: string[];
  }) {
    return await prisma.application.create({
      data: {
        type: data.type,
        studentId: data.studentId,
        data: data.data as Prisma.InputJsonValue,
        attachments: data.attachments || [],
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            universityId: true,
            email: true,
            phone: true,
            department: true,
            year: true,
            currentRoomId: true,
          },
        },
      },
    });
  }

  async findById(id: string) {
    return await prisma.application.findUnique({
      where: { id },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            universityId: true,
            email: true,
            phone: true,
            department: true,
            year: true,
            currentRoomId: true,
          },
        },
      },
    });
  }

  async findByIdWithAssignee(id: string) {
    return await prisma.application.findUnique({
      where: { id },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            universityId: true,
            email: true,
            phone: true,
            department: true,
            year: true,
            currentRoomId: true,
          },
        },
      },
    });
  }

  async findAll(filters: ApplicationFilters, pagination: PaginationParams) {
    const where: Prisma.ApplicationWhereInput = {};

    // Apply filters
    if (filters.type) {
      where.type = filters.type;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.studentId) {
      where.studentId = filters.studentId;
    }

    if (filters.assignedTo) {
      where.assignedTo = filters.assignedTo;
    }

    if (filters.assignedToRole) {
      where.assignedToRole = filters.assignedToRole;
    }

    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) {
        where.createdAt.gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        where.createdAt.lte = filters.dateTo;
      }
    }

    const page = pagination.page || 1;
    const limit = pagination.limit || 20;
    const skip = (page - 1) * limit;

    const [applications, total] = await Promise.all([
      prisma.application.findMany({
        where,
        include: {
          student: {
            select: {
              id: true,
              name: true,
              universityId: true,
              email: true,
              phone: true,
              department: true,
              year: true,
              currentRoomId: true,
            },
          },
        },
        orderBy: {
          [pagination.sortBy || 'createdAt']: pagination.sortOrder || 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.application.count({ where }),
    ]);

    return {
      applications,
      total,
    };
  }

  async findMyApplications(studentId: string, pagination: PaginationParams) {
    const page = pagination.page || 1;
    const limit = pagination.limit || 20;
    const skip = (page - 1) * limit;

    const [applications, total] = await Promise.all([
      prisma.application.findMany({
        where: { studentId },
        include: {
          student: {
            select: {
              id: true,
              name: true,
              universityId: true,
              email: true,
              phone: true,
              department: true,
              year: true,
              currentRoomId: true,
            },
          },
        },
        orderBy: {
          [pagination.sortBy || 'createdAt']: pagination.sortOrder || 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.application.count({ where: { studentId } }),
    ]);

    return {
      applications,
      total,
    };
  }

  async findAssignedToMe(userId: string, pagination: PaginationParams) {
    const page = pagination.page || 1;
    const limit = pagination.limit || 20;
    const skip = (page - 1) * limit;

    const [applications, total] = await Promise.all([
      prisma.application.findMany({
        where: { assignedTo: userId },
        include: {
          student: {
            select: {
              id: true,
              name: true,
              universityId: true,
              email: true,
              phone: true,
              department: true,
              year: true,
              currentRoomId: true,
            },
          },
        },
        orderBy: {
          [pagination.sortBy || 'createdAt']: pagination.sortOrder || 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.application.count({ where: { assignedTo: userId } }),
    ]);

    return {
      applications,
      total,
    };
  }

  async countOverlappingApplications(
    studentId: string,
    data: { startDate: string | Date; endDate: string | Date },
  ) {
    const leaves = await prisma.application.findMany({
      where: { studentId, type: 'LEAVE', status: { in: ['PENDING', 'APPROVED'] } },
      select: { data: true },
    });
    // Compared as Dates: the JSON keeps whatever date format the student sent
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    return leaves.filter(({ data: leave }) => {
      const { startDate, endDate } = leave as { startDate: string; endDate: string };
      return new Date(startDate) <= end && new Date(endDate) >= start;
    }).length;
  }

  async update(id: string, data: { data?: Record<string, unknown>; attachments?: string[] }) {
    return await prisma.application.update({
      where: { id },
      data: {
        ...(data.data && { data: data.data as Prisma.InputJsonValue }),
        ...(data.attachments && { attachments: data.attachments }),
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            universityId: true,
            email: true,
            phone: true,
            department: true,
            year: true,
            currentRoomId: true,
          },
        },
      },
    });
  }

  async assign(id: string, assignedTo: string, assignedToRole: UserRole) {
    return await prisma.application.update({
      where: { id },
      data: {
        assignedTo,
        assignedToRole,
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            universityId: true,
            email: true,
            phone: true,
            department: true,
            year: true,
            currentRoomId: true,
          },
        },
      },
    });
  }

  async respond(id: string, status: ApplicationStatus, responseNote: string, respondedAt: Date) {
    return await prisma.application.update({
      where: { id },
      data: {
        status,
        responseNote,
        respondedAt,
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            universityId: true,
            email: true,
            phone: true,
            department: true,
            year: true,
            currentRoomId: true,
          },
        },
      },
    });
  }

  async cancel(id: string) {
    return await prisma.application.update({
      where: { id },
      data: {
        status: 'CANCELLED',
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            universityId: true,
            email: true,
            phone: true,
            department: true,
            year: true,
            currentRoomId: true,
          },
        },
      },
    });
  }

  async delete(id: string) {
    return await prisma.application.delete({
      where: { id },
    });
  }

  async getStatistics(filters?: ApplicationFilters) {
    const where: Prisma.ApplicationWhereInput = {};

    if (filters?.studentId) {
      where.studentId = filters.studentId;
    }

    if (filters?.assignedTo) {
      where.assignedTo = filters.assignedTo;
    }

    const [total, byStatus, byType] = await Promise.all([
      prisma.application.count({ where }),

      prisma.application.groupBy({
        by: ['status'],
        where,
        _count: true,
      }),

      prisma.application.groupBy({
        by: ['type'],
        where,
        _count: true,
      }),
    ]);

    return {
      total,
      byStatus: byStatus.map((item) => ({
        status: item.status,
        count: item._count,
      })),
      byType: byType.map((item) => ({
        type: item.type,
        count: item._count,
      })),
    };
  }

  async existsPendingApplication(studentId: string, type: ApplicationType): Promise<boolean> {
    const count = await prisma.application.count({
      where: {
        studentId,
        type,
        status: 'PENDING',
      },
    });
    return count > 0;
  }
}

export default new ApplicationRepository();
