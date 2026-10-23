import { Router } from 'express';
import { authenticate } from '@/shared/middleware/authenticate';
import { authorize } from '@/shared/middleware/authorize';
import { validate } from '@/shared/middleware/validate';
import { strictRateLimiter } from '@/shared/middleware/rateLimit.middleware';
import controller from '../controllers/billing.controller';
import {
  billIdSchema,
  issueBillSchema,
  issueRenewalSchema,
  listBillsSchema,
  recordPaymentSchema,
} from '../validations/billing.validation';

const router = Router();

// Gateway callbacks: no login (the gateway and the payer's browser post them).
// Safe because they only trigger a server-to-server verification.
router.post('/sslcommerz/ipn', strictRateLimiter, controller.ipn);
router.post('/sslcommerz/return/:outcome', strictRateLimiter, controller.returnFromGateway);

router.use(authenticate);

// Money is handled by the hall's top admins only
const admins = authorize('SUPER_ADMIN', 'PROVOST');

router.get(
  '/my-bills',
  authorize('STUDENT'),
  validate(listBillsSchema, 'query'),
  controller.listMine,
);
router.post(
  '/bills/:id/pay',
  authorize('STUDENT'),
  validate(billIdSchema, 'params'),
  controller.pay,
);

router.post('/renewals', admins, validate(issueRenewalSchema, 'body'), controller.issueRenewals);
router.post('/bills', admins, validate(issueBillSchema, 'body'), controller.issueBill);
router.get('/bills', admins, validate(listBillsSchema, 'query'), controller.listAll);
router.post('/bills/:id/cancel', admins, validate(billIdSchema, 'params'), controller.cancel);
router.post(
  '/bills/:id/record-payment',
  admins,
  validate(billIdSchema, 'params'),
  validate(recordPaymentSchema, 'body'),
  controller.recordPayment,
);

export default router;
