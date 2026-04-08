import applicationRepository from '../repositories/application.repository';
import {
  CreateApplicationInput,
  UserContext,
  ApplicationResponse,
} from '../types/application.types';
import { ForbiddenError, ConflictError } from '@/shared/errors';

class ApplicationService {
  async createApplication(
    input: CreateApplicationInput,
    userContext: UserContext,
  ): Promise<ApplicationResponse> {
    // Only students can create applications
    if (userContext.role !== 'STUDENT') {
      throw new ForbiddenError('Only students can create applications');
    }

    // Check if student already has a pending application of the same type
    const hasPending = await applicationRepository.existsPendingApplication(
      userContext.userId,
      input.type,
    );

    if (hasPending) {
      throw new ConflictError(
        `You already have a pending ${input.type.replace(/_/g, ' ').toLowerCase()} application`,
      );
    }

    const application = await applicationRepository.create({
      type: input.type,
      studentId: userContext.userId,
      data: input.data,
      attachments: input.attachments,
    });

    return this.transformApplication(application);
  }

  private transformApplication(application: any): ApplicationResponse {
    return {
      id: application.id,
      type: application.type,
      status: application.status,
      studentId: application.studentId,
      student: application.student,
      data: application.data,
      attachments: application.attachments,
      assignedTo: application.assignedTo,
      assignedToRole: application.assignedToRole,
      responseNote: application.responseNote,
      respondedAt: application.respondedAt,
      createdAt: application.createdAt,
      updatedAt: application.updatedAt,
    };
  }
}

export default new ApplicationService();
