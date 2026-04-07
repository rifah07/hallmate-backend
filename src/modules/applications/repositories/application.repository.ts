import prisma from '@/config/database.config';
import { ApplicationType, Prisma } from '@prisma/client';
import { ApplicationFilters, PaginationParams } from '../types/application.types';

class ApplicationRepository {
  async create(data: {
    type: ApplicationType;
    studentId: string;
    data: any;
    attachments?: string[];
  }) {
    return await prisma.application.create({
      data: {
        type: data.type,
        studentId: data.studentId,
        data: data.data,
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
}

export default new ApplicationRepository();
