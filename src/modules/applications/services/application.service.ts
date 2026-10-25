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
import { notificationService } from '@/modules/notifications';
import { Application, ApplicationType } from '@prisma/client';
import type {
  SeatCancellationData,
  SeatTransferData,
  SeatSwapData,
  LeaveApplicationData,
  ComplaintData,
  MaintenanceData,
} from '../validations/application.validation';
import { roomRepository, roomService } from '@/modules/rooms';
import userService from '@/modules/users/services/user.service';
import userRepository from '@/modules/users/repositories/user.repository';

const SUPPORT_STAFF = ['OFFICE_STAFF', 'MAINTENANCE_STAFF', 'DINING_STAFF', 'GUARD'];

// "COMPLAINT" → "complaint", "SEAT_TRANSFER" → "seat transfer application"
const LABELS: Partial<Record<string, string>> = {
  COMPLAINT: 'complaint',
  MAINTENANCE: 'maintenance request',
  LEAVE: 'leave application',
};
const label = (type: string) =>
  LABELS[type] ?? `${type.replace(/_/g, ' ').toLowerCase()} application`;

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

    if (input.type === 'SEAT_SWAP') {
      input = { ...input, data: await this.resolveSwapTarget(input.data, userContext.userId) };
    }
    await this.validateApplicationRules(input.type, input.data, userContext.userId);

    const application = await applicationRepository.create({
      type: input.type,
      studentId: userContext.userId,
      data: input.data,
      attachments: input.attachments,
    });

    if (input.type === 'SEAT_SWAP') {
      await notificationService.notify(
        [(input.data as { targetStudentId: string }).targetStudentId],
        {
          type: 'APPLICATION_SUBMITTED',
          title: 'A student wants to swap beds with you',
          message: `${application.student.name} asked to swap beds with you. Open the request to agree or ignore it.`,
          entityType: 'Application',
          entityId: application.id,
        },
      );
    }

    await notificationService.notifyStaffOfStudent(userContext.userId, {
      type: 'APPLICATION_SUBMITTED',
      title: `New ${label(input.type)}`,
      message: `A student submitted a new ${label(input.type)}. Open it to review.`,
      entityType: 'Application',
      entityId: application.id,
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
      applications: applications.map((app) => this.transformApplication(app, userContext.role)),
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

    return this.transformApplication(application, userContext.role);
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

    await notificationService.notify([input.assignedTo], {
      type: 'APPLICATION_ASSIGNED',
      title: `A ${label(application.type)} was assigned to you`,
      message: `Please review and respond to this ${label(application.type)}.`,
      entityType: 'Application',
      entityId: id,
    });

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

    // Do the real-world change first: if the bed is taken or the room is
    // full, this throws and the application stays pending, untouched.
    if (input.status === 'APPROVED') {
      await this.applyApproval(application, input, userContext);
    }

    const responded = await applicationRepository.respond(
      id,
      input.status,
      input.responseNote,
      new Date(),
    );

    const decision = input.status.toLowerCase();
    await notificationService.notify(
      [application.studentId],
      {
        type: 'APPLICATION_UPDATED',
        title: `Your ${label(application.type)} was ${decision}`,
        message: input.responseNote ?? `Your ${label(application.type)} was ${decision}.`,
        entityType: 'Application',
        entityId: id,
      },
      { email: true }, // a decision is worth an email
    );

    return this.transformApplication(responded, userContext.role);
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

    // Tell the student only when someone else cancelled it
    if (userContext.userId !== application.studentId) {
      await notificationService.notify([application.studentId], {
        type: 'APPLICATION_UPDATED',
        title: `Your ${label(application.type)} was cancelled`,
        message: `The hall office cancelled your ${label(application.type)}.`,
        entityType: 'Application',
        entityId: id,
      });
    }

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

  // Support staff fixing a tap need the location (in `data`) and a name,
  // never a resident's phone, email or room.
  private transformApplication(
    application: Application & { student?: { name: string } | null },
    viewerRole?: string,
  ): ApplicationResponse {
    const seesContact = !viewerRole || !SUPPORT_STAFF.includes(viewerRole);
    return {
      id: application.id,
      type: application.type,
      status: application.status,
      studentId: application.studentId,
      student:
        seesContact || !application.student
          ? application.student
          : { name: application.student.name },
      data: application.data,
      attachments: application.attachments,
      assignedTo: application.assignedTo,
      assignedToRole: application.assignedToRole,
      responseNote: application.responseNote,
      respondedAt: application.respondedAt,
      createdAt: application.createdAt,
      updatedAt: application.updatedAt,
    } as ApplicationResponse;
  }

  private checkAccess(
    application: Pick<Application, 'studentId' | 'assignedTo'>,
    userContext: UserContext,
  ): void {
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

  private checkRespondPermission(
    application: Pick<Application, 'assignedTo'>,
    userContext: UserContext,
  ): void {
    // Admins and provost can respond to any application
    if (userContext.role === 'SUPER_ADMIN' || userContext.role === 'PROVOST') {
      return;
    }

    // Other staff can only respond to applications assigned to them
    if (application.assignedTo !== userContext.userId) {
      throw new ForbiddenError('You can only respond to applications assigned to you');
    }
  }

  /** The other student in a swap agrees. Only she can, and only once. */
  async consentToSwap(id: string, userContext: UserContext): Promise<ApplicationResponse> {
    const application = await applicationRepository.findById(id);
    const data = application?.data as
      { targetStudentId?: string; consentedAt?: string } | undefined;
    // Same 404 whether it doesn't exist or isn't addressed to her
    if (
      !application ||
      application.type !== 'SEAT_SWAP' ||
      data?.targetStudentId !== userContext.userId
    ) {
      throw new NotFoundError('Application not found');
    }
    if (application.status !== 'PENDING') {
      throw new BadRequestError('This request is no longer pending');
    }
    if (data.consentedAt) {
      throw new ConflictError('You have already agreed to this swap');
    }

    const updated = await applicationRepository.update(id, {
      data: { ...data, consentedAt: new Date().toISOString() },
    });
    await notificationService.notify([application.studentId], {
      type: 'APPLICATION_UPDATED',
      title: 'Your swap request was accepted',
      message: 'The other student agreed. The hall office will now review it.',
      entityType: 'Application',
      entityId: id,
    });
    return this.transformApplication(updated);
  }

  private async applyApproval(
    application: { id: string; type: ApplicationType; studentId: string; data: unknown },
    input: RespondToApplicationInput,
    userContext: UserContext,
  ): Promise<void> {
    const studentId = application.studentId;
    const data = application.data as Record<string, string | undefined>;
    const needAllocation = () => {
      if (!input.allocation) {
        throw new BadRequestError('Choose a room and bed (allocation) to approve this application');
      }
      return input.allocation;
    };

    switch (application.type) {
      case 'SEAT_APPLICATION': {
        const { roomId, bedNumber } = needAllocation();
        await roomService.assignStudent(roomId, { userId: studentId, bedNumber }, userContext);
        return;
      }
      case 'SEAT_TRANSFER': {
        const { roomId, bedNumber } = needAllocation();
        const current = await roomRepository.findUserCurrentRoom(studentId);
        if (!current) throw new BadRequestError('The student no longer has a room to move from');
        await roomService.transferStudent(
          current.roomId,
          { userId: studentId, targetRoomId: roomId, targetBedNumber: bedNumber },
          userContext,
        );
        return;
      }
      case 'SEAT_CANCELLATION': {
        const current = await roomRepository.findUserCurrentRoom(studentId);
        if (current) await roomService.unassignStudent(current.roomId, studentId, userContext);
        await userService.updateAccountStatus(
          studentId,
          'SEAT_CANCELLED',
          userContext.userId,
          `Cancelled at your request: ${data.reason}`,
        );
        return;
      }
      case 'SEAT_SWAP': {
        if (!data.consentedAt || !data.targetStudentId) {
          throw new BadRequestError('The other student has not agreed to this swap yet');
        }
        const [mine, theirs] = await Promise.all([
          roomRepository.findUserCurrentRoom(studentId),
          roomRepository.findUserCurrentRoom(data.targetStudentId),
        ]);
        if (!mine || !theirs) throw new BadRequestError('Both students must still have a bed');
        await roomRepository.swapStudents(
          { userId: studentId, roomId: mine.roomId, bed: mine.bedNumber },
          { userId: theirs.userId, roomId: theirs.roomId, bed: theirs.bedNumber },
        );
        await notificationService.notify([theirs.userId], {
          type: 'ROOM_UPDATED',
          title: 'Your bed changed',
          message: `Your swap was approved. You are now in room ${mine.room.roomNumber}, bed ${mine.bedNumber}.`,
          entityType: 'Room',
          entityId: mine.roomId,
        });
        return;
      }
      default:
        return; // leave, complaint, maintenance: the decision is the outcome
    }
  }

  private async validateApplicationRules(
    type: ApplicationType,
    data: Record<string, unknown>,
    studentId: string,
  ): Promise<void> {
    switch (type) {
      case 'SEAT_APPLICATION':
        await this.validateSeatApplication(data, studentId);
        break;

      case 'SEAT_CANCELLATION':
        await this.validateSeatCancellation(data as SeatCancellationData, studentId);
        break;

      case 'SEAT_TRANSFER':
        await this.validateSeatTransfer(data as SeatTransferData, studentId);
        break;

      case 'SEAT_SWAP':
        await this.validateSeatSwap(data as SeatSwapData, studentId);
        break;

      case 'LEAVE':
        await this.validateLeaveApplication(data as LeaveApplicationData, studentId);
        break;

      case 'COMPLAINT':
        await this.validateComplaint(data as ComplaintData, studentId);
        break;

      case 'MAINTENANCE':
        await this.validateMaintenance(data as MaintenanceData, studentId);
        break;

      default:
        throw new BadRequestError('Invalid application type');
    }
  }

  // ============================================================================
  // TYPE-SPECIFIC VALIDATIONS
  // ============================================================================

  private async validateSeatApplication(
    _data: Record<string, unknown>,
    studentId: string,
  ): Promise<void> {
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

  private async validateSeatCancellation(
    data: SeatCancellationData,
    studentId: string,
  ): Promise<void> {
    const currentRoom = await roomRepository.findUserCurrentRoom(studentId);

    if (!currentRoom) {
      throw new BadRequestError('You do not have a room assigned to cancel');
    }

    const effectiveDate = new Date(data.effectiveDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (effectiveDate < today) {
      throw new BadRequestError('Effective date must be in the future');
    }

    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);

    if (effectiveDate > threeMonthsFromNow) {
      throw new BadRequestError('Effective date cannot be more than 3 months in the future');
    }
  }
  private async validateSeatTransfer(data: SeatTransferData, studentId: string): Promise<void> {
    const currentRoom = await roomRepository.findUserCurrentRoom(studentId);
    if (!currentRoom) {
      throw new BadRequestError('You do not have a room assigned to transfer from');
    }

    // findUserCurrentRoom returns the occupant row; its roomId is the room
    if (data.currentRoomId !== currentRoom.roomId) {
      throw new BadRequestError('Current room ID does not match your assigned room');
    }

    if (data.targetRoomId) {
      const targetRoom = await roomRepository.findById(data.targetRoomId);
      /*  const targetRoom = await prisma.room.findUnique({
       where: { id: data.targetRoomId },
       include: {
         occupants: true
       },
     }); */

      if (!targetRoom) {
        throw new NotFoundError('Target room not found');
      }

      if (targetRoom.status !== 'AVAILABLE' && targetRoom.status !== 'PARTIALLY_OCCUPIED') {
        throw new BadRequestError('Target room is not available for transfer');
      }

      const vacantBeds = targetRoom.capacity - targetRoom.occupants.length;
      if (vacantBeds <= 0) {
        throw new BadRequestError('Target room is full');
      }
    }

    const hasPendingTransfer = await applicationRepository.existsPendingApplication(
      studentId,
      'SEAT_TRANSFER',
    );

    if (hasPendingTransfer) {
      throw new ConflictError('You already have a pending seat transfer application');
    }
  }
  private async resolveSwapTarget(
    data: { targetUniversityId?: string; [key: string]: unknown },
    studentId: string,
  ) {
    const { targetUniversityId, ...rest } = data;
    const resolved = { ...rest };
    if (targetUniversityId) {
      const [mine, target] = await Promise.all([
        roomRepository.findUserCurrentRoom(studentId),
        userRepository.findByUniversityId(targetUniversityId),
      ]);
      if (!target) throw new NotFoundError('Target student not found');
      resolved.currentRoomId ??= mine?.roomId;
      resolved.targetStudentId = target.id;
      resolved.targetRoomId = target.currentRoomId ?? undefined;
    }
    if (!resolved.targetStudentId || !resolved.currentRoomId) {
      throw new BadRequestError('Enter the university ID of the student you want to swap with');
    }
    return resolved as CreateApplicationInput['data'];
  }

  private async validateSeatSwap(data: SeatSwapData, studentId: string): Promise<void> {
    /*  // Check if student has a current room
   const student = await prisma.user.findUnique({
     where: { id: studentId },
     select: { currentRoomId: true },
   });

   if (!student?.currentRoomId) {
     throw new BadRequestError('You do not have a room assigned');
   } */

    const currentRoom = await roomRepository.findUserCurrentRoom(studentId);

    if (!currentRoom) {
      throw new BadRequestError('You do not have a room assigned');
    }

    // findUserCurrentRoom returns the occupant row; its roomId is the room
    if (data.currentRoomId !== currentRoom.roomId) {
      throw new BadRequestError('Current room ID does not match your assigned room');
    }

    const targetStudent = await userRepository.findByIdWithAccountStatusAndRoom(
      data.targetStudentId as string,
    );

    if (!targetStudent) {
      throw new NotFoundError('Target student not found');
    }

    if (targetStudent.role !== 'STUDENT') {
      throw new BadRequestError('Target user must be a student');
    }

    if (targetStudent.accountStatus !== 'ACTIVE') {
      throw new BadRequestError('Target student account is not active');
    }

    if (!targetStudent.currentRoomId) {
      throw new BadRequestError('Target student does not have a room assigned');
    }

    if (data.targetRoomId !== targetStudent.currentRoomId) {
      throw new BadRequestError("Target room ID does not match target student's assigned room");
    }

    if (data.targetStudentId === studentId) {
      throw new BadRequestError('Cannot swap room with yourself');
    }

    const [presentRoom, targetRoom] = await Promise.all([
      roomRepository.findById(data.currentRoomId),
      roomRepository.findById(data.targetRoomId),
    ]);

    if (!presentRoom || !targetRoom) {
      throw new NotFoundError('One or both rooms not found');
    }

    const hasPendingSwap = await applicationRepository.existsPendingApplication(
      studentId,
      'SEAT_SWAP',
    );

    if (hasPendingSwap) {
      throw new ConflictError('You already have a pending seat swap application');
    }
    // Consent is given later by the other student herself (POST .../consent);
    // a flag typed in by the requester proves nothing.
  }
  private async validateLeaveApplication(
    data: LeaveApplicationData,
    studentId: string,
  ): Promise<void> {
    const currentRoom = await roomRepository.findUserCurrentRoom(studentId);
    if (!currentRoom) {
      throw new BadRequestError('You must have a room assigned to apply for leave');
    }

    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Start date must be in the future (or today for emergency)
    if (data.leaveType !== 'EMERGENCY' && startDate < today) {
      throw new BadRequestError('Leave start date must be in the future');
    }

    if (endDate <= startDate) {
      throw new BadRequestError('Leave end date must be after start date');
    }

    const durationDays = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (data.leaveType === 'SHORT_LEAVE' && durationDays > 3) {
      throw new BadRequestError('Short leave cannot exceed 3 days');
    }

    if (data.leaveType === 'OVERNIGHT' && durationDays > 1) {
      throw new BadRequestError('Overnight leave is for single night only');
    }

    if (data.leaveType === 'LONG_LEAVE' && durationDays > 30) {
      throw new BadRequestError('Long leave cannot exceed 30 days');
    }

    const overlappingLeaves = await applicationRepository.countOverlappingApplications(
      studentId,
      data,
    );

    if (overlappingLeaves > 0) {
      throw new ConflictError('You have overlapping leave applications');
    }
  }
  private async validateComplaint(data: ComplaintData, studentId: string): Promise<void> {
    if (data.roomId) {
      const room = await roomRepository.findRoomWithFilteredOccupant(data.roomId, studentId);

      if (!room) {
        throw new NotFoundError('Room not found');
      }

      if (room.occupants.length === 0) {
        // Not their room - only allow for certain categories
        const allowedCategories = ['CLEANLINESS', 'MESS_FOOD', 'NOISE', 'SECURITY'];
        if (!allowedCategories.includes(data.category)) {
          throw new BadRequestError(
            'You can only file complaints about your own room for this category',
          );
        }
      }
    }

    if (data.category === 'SECURITY' || data.category === 'HARASSMENT') {
      if (data.priority === 'LOW') {
        throw new BadRequestError(
          'Security and harassment complaints must be at least NORMAL priority',
        );
      }
    }
  }

  private async validateMaintenance(data: MaintenanceData, studentId: string): Promise<void> {
    if (data.roomId) {
      const room = await roomRepository.findRoomWithFilteredOccupant(data.roomId, studentId);

      if (!room) {
        throw new NotFoundError('Room not found');
      }

      if (room.occupants.length === 0) {
        throw new BadRequestError('You can only request maintenance for your assigned room');
      }
    }

    if (data.preferredDate) {
      const preferredDate = new Date(data.preferredDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (preferredDate < today) {
        throw new BadRequestError('Preferred maintenance date must be in the future');
      }

      const oneMonthFromNow = new Date();
      oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);

      if (preferredDate > oneMonthFromNow) {
        throw new BadRequestError('Preferred date cannot be more than 1 month in the future');
      }
    }
  }
}

export default new ApplicationService();
