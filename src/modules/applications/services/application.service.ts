// src/modules/applications/services/application.service.ts

import applicationRepository from '../repositories/application.repository';
import {
  CreateApplicationInput,
  ApplicationFilters,
  PaginationParams,
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

  async getApplications(
    filters: ApplicationFilters,
    pagination: PaginationParams,
    userContext: UserContext,
  ) {
    // Students can only see their own applications
    if (userContext.role === 'STUDENT') {
      filters.studentId = userContext.userId;
    }

    const { applications, total } = await applicationRepository.findAll(filters, pagination);

    const page = pagination.page || 1;
    const limit = pagination.limit || 20;

    return {
      applications: applications.map((app) => this.transformApplication(app)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getMyApplications(pagination: PaginationParams, userContext: UserContext) {
    if (userContext.role !== 'STUDENT') {
      throw new ForbiddenError('Only students can view their applications');
    }

    const { applications, total } = await applicationRepository.findMyApplications(
      userContext.userId,
      pagination,
    );

    const page = pagination.page || 1;
    const limit = pagination.limit || 20;

    return {
      applications: applications.map((app) => this.transformApplication(app)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getAssignedApplications(pagination: PaginationParams, userContext: UserContext) {
    // Only staff can have assigned applications
    if (userContext.role === 'STUDENT' || userContext.role === 'PARENT') {
      throw new ForbiddenError('You do not have permission to view assigned applications');
    }

    const { applications, total } = await applicationRepository.findAssignedToMe(
      userContext.userId,
      pagination,
    );

    const page = pagination.page || 1;
    const limit = pagination.limit || 20;

    return {
      applications: applications.map((app) => this.transformApplication(app)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

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
