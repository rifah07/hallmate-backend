import { Router } from 'express';
import { authenticate } from '@/shared/middleware/authenticate';
import { authorize } from '@/shared/middleware/authorize';
import { validate } from '@/shared/middleware/validate';
import { uploadPdf, handleMulterError } from '@/shared/middleware/upload.middleware';
import controller from '../controllers/notice.controller';
import {
  createNoticeSchema,
  listNoticesSchema,
  noticeIdSchema,
  updateNoticeSchema,
} from '../validations/notice.validation';

const router = Router();
router.use(authenticate);

// Reading: every signed-in user; what she sees is scoped in the service
router.get('/', validate(listNoticesSchema, 'query'), controller.list);
router.get('/:id', validate(noticeIdSchema, 'params'), controller.get);

// Writing: provost and super admin anywhere, house tutors for their floor
const writers = authorize('SUPER_ADMIN', 'PROVOST', 'HOUSE_TUTOR');
const pdf = [uploadPdf.single('pdf'), handleMulterError];

router.post('/', writers, ...pdf, validate(createNoticeSchema, 'body'), controller.create);
router.patch(
  '/:id',
  writers,
  validate(noticeIdSchema, 'params'),
  ...pdf,
  validate(updateNoticeSchema, 'body'),
  controller.update,
);
router.delete('/:id', writers, validate(noticeIdSchema, 'params'), controller.withdraw);

export default router;
