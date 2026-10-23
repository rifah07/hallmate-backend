import { Router } from 'express';
import { authenticate } from '@/shared/middleware/authenticate';
import { validate } from '@/shared/middleware/validate';
import controller from '../controllers/notification.controller';
import {
  listNotificationsSchema,
  notificationIdSchema,
} from '../validations/notification.validation';

const router = Router();

// Every role has notifications; each user only ever sees her own
router.use(authenticate);

router.get('/', validate(listNotificationsSchema, 'query'), controller.list);
router.get('/unread-count', controller.unreadCount); // the bell polls this
router.patch('/read-all', controller.markAllRead);
router.patch('/:id/read', validate(notificationIdSchema, 'params'), controller.markRead);

export default router;
