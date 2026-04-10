import prisma from '@/database/prisma/client';
import applicationRepository from '../repositories/application.repository';
import {
  CreateApplicationInput,
  UpdateApplicationInput,
  AssignApplicationInput,
  RespondToApplicationInput,
  ApplicationFilters,
  PaginationParams,
  UserContext,
  ApplicationResponse,
} from '../types/application.types';
import { BadRequestError, NotFoundError, ForbiddenError, ConflictError } from '@/shared/errors/';
import { ApplicationType } from '@prisma/client';
import { roomRepository } from '@/modules/rooms';
import userRepository from '@/modules/users/repositories/user.repository';

class ApplicationService {
  async createApplication(
    input: CreateApplicationInput,
    userContext: UserContext,
  ): Promise<ApplicationResponse> {
    if (userContext.role !== 'STUDENT') {
      throw new ForbiddenError('Only students can create applications');
    }

    const hasPending = await applicationRepository.existsPendingApplication(
      userContext.userId,
      input.type,
    );

    if (hasPending) {
      throw new ConflictError(
        `You already have a pending ${input.type.replace(/_/g, ' ').toLowerCase()} application`,
      );
    }

    await this.validateApplicationRules(input.type, input.data, userContext.userId);

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

  async getApplicationById(id: string, userContext: UserContext): Promise<ApplicationResponse> {
    const application = await applicationRepository.findById(id);

    if (!application) {
      throw new NotFoundError('Application not found');
    }

    // Check access
    this.checkAccess(application, userContext);

    return this.transformApplication(application);
  }

  async updateApplication(
    id: string,
    input: UpdateApplicationInput,
    userContext: UserContext,
  ): Promise<ApplicationResponse> {
    const application = await applicationRepository.findById(id);

    if (!application) {
      throw new NotFoundError('Application not found');
    }

    if (application.studentId !== userContext.userId) {
      throw new ForbiddenError('You can only update your own applications');
    }

    if (application.status !== 'PENDING') {
      throw new BadRequestError('Cannot update application that has been processed');
    }

    const updated = await applicationRepository.update(id, input);

    return this.transformApplication(updated);
  }

  async assignApplication(
    id: string,
    input: AssignApplicationInput,
    userContext: UserContext,
  ): Promise<ApplicationResponse> {
    if (userContext.role !== 'SUPER_ADMIN' && userContext.role !== 'PROVOST') {
      throw new ForbiddenError('Only admins and provost can assign applications');
    }

    const application = await applicationRepository.findById(id);

    if (!application) {
      throw new NotFoundError('Application not found');
    }

    if (application.status !== 'PENDING') {
      throw new BadRequestError('Can only assign pending applications');
    }

    const assigned = await applicationRepository.assign(id, input.assignedTo, input.assignedToRole);

    return this.transformApplication(assigned);
  }

  async respondToApplication(
    id: string,
    input: RespondToApplicationInput,
    userContext: UserContext,
  ): Promise<ApplicationResponse> {
    const application = await applicationRepository.findById(id);

    if (!application) {
      throw new NotFoundError('Application not found');
    }

    this.checkRespondPermission(application, userContext);

    if (application.status !== 'PENDING') {
      throw new BadRequestError('Application has already been processed');
    }

    if (input.status === 'PENDING') {
      throw new BadRequestError('Invalid status');
    }

    const responded = await applicationRepository.respond(
      id,
      input.status,
      input.responseNote,
      new Date(),
    );

    return this.transformApplication(responded);
  }

  async cancelApplication(id: string, userContext: UserContext): Promise<ApplicationResponse> {
    const application = await applicationRepository.findById(id);

    if (!application) {
      throw new NotFoundError('Application not found');
    }

    if (userContext.role === 'STUDENT') {
      if (application.studentId !== userContext.userId) {
        throw new ForbiddenError('You can only cancel your own applications');
      }

      if (application.status !== 'PENDING') {
        throw new BadRequestError('Can only cancel pending applications');
      }
    }

    if (userContext.role !== 'STUDENT') {
      if (application.status !== 'PENDING') {
        throw new BadRequestError('Can only cancel pending applications');
      }
    }

    const cancelled = await applicationRepository.cancel(id);

    return this.transformApplication(cancelled);
  }

  async deleteApplication(id: string, userContext: UserContext): Promise<void> {
    if (userContext.role !== 'SUPER_ADMIN' && userContext.role !== 'PROVOST') {
      throw new ForbiddenError('Only admins can delete applications');
    }

    const application = await applicationRepository.findById(id);

    if (!application) {
      throw new NotFoundError('Application not found');
    }

    await applicationRepository.delete(id);
  }

  async getStatistics(userContext: UserContext) {
    const filters: ApplicationFilters = {};

    if (userContext.role === 'STUDENT') {
      filters.studentId = userContext.userId;
    }

    const stats = await applicationRepository.getStatistics(filters);

    const pending = stats.byStatus.find((s) => s.status === 'PENDING')?.count || 0;
    const approved = stats.byStatus.find((s) => s.status === 'APPROVED')?.count || 0;
    const rejected = stats.byStatus.find((s) => s.status === 'REJECTED')?.count || 0;
    const cancelled = stats.byStatus.find((s) => s.status === 'CANCELLED')?.count || 0;

    return {
      total: stats.total,
      byStatus: stats.byStatus,
      byType: stats.byType,
      pending,
      approved,
      rejected,
      cancelled,
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

  private checkAccess(application: any, userContext: UserContext): void {
    if (userContext.role === 'STUDENT') {
      if (application.studentId !== userContext.userId) {
        throw new ForbiddenError('You can only view your own applications');
      }
    }

    if (
      userContext.role !== 'SUPER_ADMIN' &&
      userContext.role !== 'PROVOST' &&
      userContext.role !== 'STUDENT'
    ) {
      if (application.assignedTo !== userContext.userId) {
        throw new ForbiddenError('You can only view applications assigned to you');
      }
    }
  }

  private checkRespondPermission(application: any, userContext: UserContext): void {
    // Admins and provost can respond to any application
    if (userContext.role === 'SUPER_ADMIN' || userContext.role === 'PROVOST') {
      return;
    }

    // Other staff can only respond to applications assigned to them
    if (application.assignedTo !== userContext.userId) {
      throw new ForbiddenError('You can only respond to applications assigned to you');
    }
  }

  private async validateApplicationRules(
    type: ApplicationType,
    data: any,
    studentId: string,
  ): Promise<void> {
    switch (type) {
      case 'SEAT_APPLICATION':
        await this.validateSeatApplication(data, studentId);
        break;

      case 'SEAT_CANCELLATION':
        await this.validateSeatCancellation(data, studentId);
        break;

      case 'SEAT_TRANSFER':
        await this.validateSeatTransfer(data, studentId);
        break;

      case 'SEAT_SWAP':
        await this.validateSeatSwap(data, studentId);
        break;

      case 'LEAVE':
        await this.validateLeaveApplication(data, studentId);
        break;

      case 'COMPLAINT':
        await this.validateComplaint(data, studentId);
        break;

      case 'MAINTENANCE':
        await this.validateMaintenance(data, studentId);
        break;

      default:
        throw new BadRequestError('Invalid application type');
    }
  }

  // ============================================================================
  // TYPE-SPECIFIC VALIDATIONS
  // ============================================================================

  private async validateSeatApplication(_data: any, studentId: string): Promise<void> {
    const currentRoom = await roomRepository.findUserCurrentRoom(studentId);

    if (currentRoom) {
      throw new ConflictError(
        'You already have a room assigned. Please cancel your current seat first.',
      );
    }

    const hasPendingSeatApp = await applicationRepository.existsPendingApplication(
      studentId,
      'SEAT_APPLICATION',
    );

    if (hasPendingSeatApp) {
      throw new ConflictError('You already have a pending seat application');
    }
  }

  private async validateSeatCancellation(data: any, studentId: string): Promise<void> {}

  private async validateSeatTransfer(data: any, studentId: string): Promise<void> {}

  private async validateSeatSwap(data: any, studentId: string): Promise<void> {}

  private async validateLeaveApplication(data: any, studentId: string): Promise<void> {}

  private async validateComplaint(data: any, studentId: string): Promise<void> {}

  private async validateMaintenance(data: any, studentId: string): Promise<void> {}
}

export default new ApplicationService();
