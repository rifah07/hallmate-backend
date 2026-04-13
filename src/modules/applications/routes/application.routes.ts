import { Router } from 'express';
import applicationController from '../controllers/application.controller';
import { authenticate } from '@/shared/middleware/authenticate';
import { authorize } from '@/shared/middleware/authorize';
import { validate } from '@/shared/middleware/validate';

import {
  createApplicationSchema,
  applicationQuerySchema,
} from '../validations/application.validation';

const router = Router();

router.use(authenticate);

// GET /api/applications/statistics - Get statistics
router.get(
  '/statistics',
  authorize('SUPER_ADMIN', 'PROVOST', 'HOUSE_TUTOR', 'OFFICE_STAFF', 'STUDENT'),
  applicationController.getStatistics,
);

// GET /api/applications/my-applications - Get my applications (student only)
router.get('/my-applications', authorize('STUDENT'), applicationController.getMyApplications);

// GET /api/applications/assigned - Get applications assigned to me (staff only)
router.get(
  '/assigned',
  authorize('SUPER_ADMIN', 'PROVOST', 'HOUSE_TUTOR', 'OFFICE_STAFF', 'ASSISTANT_WARDEN'),
  applicationController.getAssignedApplications,
);

// GET /api/applications - List all applications
router.get(
  '/',
  authorize('SUPER_ADMIN', 'PROVOST', 'HOUSE_TUTOR', 'OFFICE_STAFF', 'STUDENT'),
  validate(applicationQuerySchema, 'query'),
  applicationController.getAllApplications,
);

// POST /api/applications - Create new application (student only)
router.post(
  '/',
  authorize('STUDENT'),
  validate(createApplicationSchema, 'body'),
  applicationController.createApplication,
);

export default router;
