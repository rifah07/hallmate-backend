import { Router } from 'express';
import { authenticate } from '@/shared/middleware/authenticate';
import { authorize } from '@/shared/middleware/authorize';
import { validate } from '@/shared/middleware/validate';
import controller from '../controllers/id-card.controller';
import { verifyCardSchema } from '../validations/id-card.validation';

const router = Router();
router.use(authenticate);

router.get('/me', authorize('STUDENT'), controller.myCard);
// Scanning reveals a resident's photo and room, so only gate and hall staff
router.post(
  '/verify',
  authorize('GUARD', 'HOUSE_TUTOR', 'PROVOST', 'SUPER_ADMIN'),
  validate(verifyCardSchema, 'body'),
  controller.verify,
);

export default router;
