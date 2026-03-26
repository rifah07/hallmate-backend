import express, { Application, NextFunction, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { corsOptions } from './config/cors.config';
import { errorHandler } from './shared/middleware/errorHandler';
import logger from './shared/utils/logger.util';
import authRoutes from './modules/auth/routes/auth.routes';
import cookieParser from 'cookie-parser';
import { setupSwagger } from './config/swagger.config';
import userRoutes from './modules/users/routes/user.routes';
import { roomRoutes } from './modules/rooms';

const app: Application = express();

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: {
      message: 'Too many requests, please try again later.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

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
