import prisma from '@/config/database.config';
import { ApplicationType } from '@prisma/client';

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
}

export default new ApplicationRepository();
