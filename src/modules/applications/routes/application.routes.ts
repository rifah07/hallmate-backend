import { Router } from 'express';
import applicationController from '../controllers/application.controller';
import { authenticate } from '@/shared/middleware/authenticate';
import { authorize } from '@/shared/middleware/authorize';
import { validate } from '@/shared/middleware/validate';

import {
  createApplicationSchema,
  updateApplicationSchema,
  assignApplicationSchema,
  respondToApplicationSchema,
  applicationQuerySchema,
  applicationIdSchema,
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

// GET /api/applications/:applicationId - Get application by ID
router.get(
  '/:applicationId',
  authorize('SUPER_ADMIN', 'PROVOST', 'HOUSE_TUTOR', 'OFFICE_STAFF', 'STUDENT'),
  validate(applicationIdSchema, 'params'),
  applicationController.getApplicationById,
);

// PATCH /api/applications/:applicationId - Update application (student only, own applications)
router.patch(
  '/:applicationId',
  authorize('STUDENT'),
  validate(applicationIdSchema, 'params'),
  validate(updateApplicationSchema, 'body'),
  applicationController.updateApplication,
);

// DELETE /api/applications/:applicationId - Delete application (admin only)
router.delete(
  '/:applicationId',
  authorize('SUPER_ADMIN', 'PROVOST'),
  validate(applicationIdSchema, 'params'),
  applicationController.deleteApplication,
);

// POST /api/applications/:applicationId/assign - Assign application to staff
router.post(
  '/:applicationId/assign',
  authorize('SUPER_ADMIN', 'PROVOST'),
  validate(applicationIdSchema, 'params'),
  validate(assignApplicationSchema, 'body'),
  applicationController.assignApplication,
);

// POST /api/applications/:applicationId/respond - Respond to application (approve/reject)
router.post(
  '/:applicationId/respond',
  authorize('SUPER_ADMIN', 'PROVOST', 'HOUSE_TUTOR', 'OFFICE_STAFF', 'ASSISTANT_WARDEN'),
  validate(applicationIdSchema, 'params'),
  validate(respondToApplicationSchema, 'body'),
  applicationController.respondToApplication,
);

// POST /api/applications/:applicationId/cancel - Cancel application
router.post(
  '/:applicationId/cancel',
  authorize('SUPER_ADMIN', 'PROVOST', 'STUDENT'),
  validate(applicationIdSchema, 'params'),
  applicationController.cancelApplication,
);

export default router;
