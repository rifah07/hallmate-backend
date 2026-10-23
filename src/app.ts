import express, { Application, NextFunction, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { corsOptions } from './config/cors.config';
import { errorHandler } from './shared/middleware/errorHandler';
import { apiRateLimiter } from './shared/middleware/rateLimit.middleware';
import logger from './shared/utils/logger.util';
import authRoutes from './modules/auth/routes/auth.routes';
import cookieParser from 'cookie-parser';
import { setupSwagger } from './config/swagger.config';
import userRoutes from './modules/users/routes/user.routes';
import { roomRoutes } from './modules/rooms';
import applicationRoutes from './modules/applications/routes/application.routes';
import { mealRoutes } from './modules/meals';
import mealCancellationRoutes from './modules/meals_2.0/routes/meal.routes';
import { publicRouter } from './modules/public';
import { adminRouter } from './modules/admin';
import { notificationRoutes } from './modules/notifications';
import { noticeRoutes } from './modules/notices';
import { billingRoutes } from './modules/billing';
import { visitorRoutes } from './modules/visitors';
import { idCardRoutes } from './modules/id-card';
import { dashboardRoutes } from './modules/dashboard';

const app: Application = express();

// Security middleware
app.use(helmet());

// One proxy hop (Vercel's edge) sets X-Forwarded-For; req.ip reads it
app.set('trust proxy', 1);

app.use('/api', apiRateLimiter);

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Request logging
app.use((req: Request, _res: Response, next) => {
  logger.http(`${req.method} ${req.path}`);
  next();
});

setupSwagger(app);

// Health check route
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Server is running smoothly',
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to the HallMate Backend Server API',
    version: '1.0.0',
    documentation: '/api-docs',
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/applications', applicationRoutes);
// Cancellations first: /planning/:date would otherwise match v1's /:studentId/:date
app.use('/api/meals', mealCancellationRoutes);
app.use('/api/meals', mealRoutes);
app.use('/api/public', publicRouter);
app.use('/api/admin', adminRouter);
app.use('/api/notifications', notificationRoutes);
app.use('/api/notices', noticeRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/visitors', visitorRoutes);
app.use('/api/id-card', idCardRoutes);
app.use('/api/dashboard', dashboardRoutes);

// 404 handler
app.use((_req: Request, res: Response, _next: NextFunction) => {
  res.status(404).json({
    success: false,
    message: 'Resource not found',
  });
});

// Global error handler
app.use(errorHandler);

export default app;
