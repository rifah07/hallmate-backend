import { BadRequestError, NotFoundError } from '@/shared/errors';
import { JWTPayload } from '@/shared/utils/crypto/jwt.util';
import { decodeCursor, toPage } from '@/shared/utils/cursor.util';
import { addDays, dhakaToday } from '@/shared/utils/dhaka-date.util';
import { notificationService } from '@/modules/notifications';
import visitorRepository from '../repositories/visitor.repository';
import { DecideVisitInput, RequestVisitInput } from '../validations/visitor.validation';

const MAX_DAYS_AHEAD = 14;
const HALL_WIDE = ['SUPER_ADMIN', 'PROVOST'];

class VisitorService {
  async request(student: JWTPayload, input: RequestVisitInput) {
    const today = dhakaToday();
    if (input.visitDate < today || input.visitDate > addDays(today, MAX_DAYS_AHEAD)) {
      throw new BadRequestError(`Choose a day between today and ${MAX_DAYS_AHEAD} days from now`);
    }
    const visit = await visitorRepository.create({ ...input, studentId: student.userId });
    await notificationService.notifyStaffOfStudent(student.userId, {
      type: 'APPLICATION_SUBMITTED',
      title: 'New visitor request',
      message: `${input.name} (${input.relation}) on ${input.visitDate.toDateString()}.`,
      entityType: 'Visitor',
      entityId: visit.id,
    });
    return visit;
  }

  async listMine(student: JWTPayload, limit: number, cursor?: string) {
    return toPage(
      await visitorRepository.listForStudent(student.userId, limit, decodeCursor(cursor)),
      limit,
    );
  }

  /** A house tutor sees her floor's requests; the provost sees all. */
  async listPending(staff: JWTPayload) {
    if (HALL_WIDE.includes(staff.role)) return visitorRepository.listPending();
    if (!staff.assignedFloor) return [];
    return visitorRepository.listPending(staff.assignedFloor);
  }

  async decide(staff: JWTPayload, id: string, input: DecideVisitInput) {
    const visit = await visitorRepository.findById(id);
    const onHerFloor =
      HALL_WIDE.includes(staff.role) ||
      (staff.assignedFloor != null && visit?.student.currentRoom?.floor === staff.assignedFloor);
    if (!visit || !onHerFloor) throw new NotFoundError('Visit not found');

    const moved = await visitorRepository.transition(id, ['PENDING'], {
      status: input.approve ? 'APPROVED' : 'REJECTED',
      decidedBy: staff.userId,
      decidedAt: new Date(),
      decisionNote: input.note,
    });
    if (!moved) throw new BadRequestError('This request was already decided');

    await notificationService.notify([visit.studentId], {
      type: 'APPLICATION_UPDATED',
      title: input.approve ? 'Visitor approved' : 'Visitor not approved',
      message: `${visit.name} on ${visit.visitDate.toDateString()}${input.note ? `: ${input.note}` : '.'}`,
      entityType: 'Visitor',
      entityId: id,
    });
  }

  async cancel(student: JWTPayload, id: string) {
    const moved = await visitorRepository.transition(
      id,
      ['PENDING', 'APPROVED'],
      { status: 'CANCELLED' },
      { studentId: student.userId }, // only her own
    );
    if (!moved) throw new NotFoundError('No visit to cancel');
  }

  async today() {
    return visitorRepository.listForDay(dhakaToday());
  }

  /** The guard lets her in. Only an approved visit, and only on its day. */
  async checkIn(guard: JWTPayload, id: string) {
    const moved = await visitorRepository.transition(
      id,
      ['APPROVED'],
      { status: 'CHECKED_IN', checkedInAt: new Date(), guardId: guard.userId },
      { visitDate: dhakaToday() },
    );
    if (!moved) throw new BadRequestError('This visitor is not approved for today');

    const visit = await visitorRepository.findById(id);
    await notificationService.notify([visit!.studentId], {
      type: 'APPLICATION_UPDATED',
      title: 'Your visitor has arrived',
      message: `${visit!.name} is at the gate.`,
      entityType: 'Visitor',
      entityId: id,
    });
  }

  async checkOut(id: string) {
    const moved = await visitorRepository.transition(id, ['CHECKED_IN'], {
      status: 'CHECKED_OUT',
      checkedOutAt: new Date(),
    });
    if (!moved) throw new BadRequestError('This visitor has not checked in');
  }
}

export default new VisitorService();
