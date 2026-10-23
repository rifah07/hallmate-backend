import { JWTPayload } from '@/shared/utils/crypto/jwt.util';
import { dhakaToday } from '@/shared/utils/dhaka-date.util';
import { notificationService } from '@/modules/notifications';
import { noticeService } from '@/modules/notices';
import dashboardRepository from '../repositories/dashboard.repository';

const COMPLAINT_TYPES = ['COMPLAINT', 'MAINTENANCE'];

/** One request per page load; every query runs in parallel. */
class DashboardService {
  async forUser(user: JWTPayload) {
    const [unread, notices] = await Promise.all([
      notificationService.unreadCount(user.userId),
      noticeService.list(user, 3),
    ]);
    const common = { unreadNotifications: unread.count, latestNotices: notices.items };

    switch (user.role) {
      case 'STUDENT':
        return { ...common, ...(await this.student(user.userId)) };
      case 'HOUSE_TUTOR':
        return { ...common, ...(await this.hall(user.assignedFloor ?? undefined)) };
      case 'PROVOST':
      case 'SUPER_ADMIN':
        return {
          ...common,
          ...(await this.hall()),
          renewal: await dashboardRepository.renewalCollection(
            String(dhakaToday().getUTCFullYear()),
          ),
        };
      case 'GUARD':
        return { ...common, visitorsToday: await dashboardRepository.visitorsForDay(dhakaToday()) };
      default:
        return common; // support staff: notices and notifications only
    }
  }

  private async student(studentId: string) {
    const [bed, bills, pendingApplications, upcomingVisitors] = await Promise.all([
      dashboardRepository.myBed(studentId),
      dashboardRepository.myUnpaidBills(studentId),
      dashboardRepository.myPendingApplications(studentId),
      dashboardRepository.myUpcomingVisitors(studentId, dhakaToday()),
    ]);
    return {
      room: bed && {
        roomNumber: bed.room.roomNumber,
        floor: bed.room.floor,
        wing: bed.room.wing,
        bedNumber: bed.bedNumber,
        roommates: bed.room.occupants.map((o) => ({ name: o.user.name, bedNumber: o.bedNumber })),
      },
      unpaidBills: bills,
      pendingApplications,
      upcomingVisitors,
    };
  }

  /** The whole hall, or one floor when `floor` is given. */
  private async hall(floor?: number) {
    const [occupancy, pending, pendingVisitors] = await Promise.all([
      dashboardRepository.occupancy(floor),
      dashboardRepository.pendingApplicationsByType(floor),
      dashboardRepository.pendingVisitors(floor),
    ]);
    const openComplaints = COMPLAINT_TYPES.reduce((sum, type) => sum + (pending[type] ?? 0), 0);
    return {
      scope: floor ? { floor } : 'hall',
      occupancy: {
        ...occupancy,
        rate: occupancy.beds ? Math.round((occupancy.occupied / occupancy.beds) * 100) : 0,
      },
      pendingApplications: pending,
      openComplaints,
      pendingVisitors,
    };
  }
}

export default new DashboardService();
