import { Router } from 'express';
import { authenticate } from '@/shared/middleware/authenticate';
import controller from '../controllers/dashboard.controller';

const router = Router();

// One endpoint for every role: the service decides what each one may see
router.get('/', authenticate, controller.get);

export default router;
