import { Router } from 'express';
import { authenticate } from '@/shared/middleware/authenticate';
import { authorize } from '@/shared/middleware/authorize';
import { validate } from '@/shared/middleware/validate';
import controller from '../controllers/visitor.controller';
import {
  decideVisitSchema,
  listVisitsSchema,
  requestVisitSchema,
  visitIdSchema,
} from '../validations/visitor.validation';

const router = Router();
router.use(authenticate);

const student = authorize('STUDENT');
const approvers = authorize('SUPER_ADMIN', 'PROVOST', 'HOUSE_TUTOR');
const gate = authorize('GUARD', 'SUPER_ADMIN', 'PROVOST');
const id = validate(visitIdSchema, 'params');

router.post('/', student, validate(requestVisitSchema, 'body'), controller.request);
router.get('/mine', student, validate(listVisitsSchema, 'query'), controller.listMine);
router.post('/:id/cancel', student, id, controller.cancel);

router.get('/pending', approvers, controller.listPending);
router.post('/:id/decision', approvers, id, validate(decideVisitSchema, 'body'), controller.decide);

router.get('/today', gate, controller.today);
router.post('/:id/check-in', gate, id, controller.checkIn);
router.post('/:id/check-out', gate, id, controller.checkOut);

export default router;
