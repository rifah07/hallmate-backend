import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '@/shared/utils/response.util';
import notificationService from '../services/notification.service';
import { ListNotificationsQuery } from '../validations/notification.validation';

// Every handler acts on req.user only: there is no way to name another user.
class NotificationController {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { limit, cursor } = req.query as unknown as ListNotificationsQuery;
      sendSuccess(res, await notificationService.list(req.user!.userId, limit, cursor));
    } catch (error) {
      next(error);
    }
  }

  async unreadCount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      sendSuccess(res, await notificationService.unreadCount(req.user!.userId));
    } catch (error) {
      next(error);
    }
  }

  async markRead(req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> {
    try {
      await notificationService.markRead(req.user!.userId, req.params.id);
      sendSuccess(res, null, 'Marked as read');
    } catch (error) {
      next(error);
    }
  }

  async markAllRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      sendSuccess(
        res,
        await notificationService.markAllRead(req.user!.userId),
        'All marked as read',
      );
    } catch (error) {
      next(error);
    }
  }
}

export default new NotificationController();
