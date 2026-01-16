import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import { corsOptions } from './config/cors.config';
import { errorHandler } from './shared/middleware/errorHandler';
import logger from './shared/utils/logger.util';

const app: Application = express();

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req: Request, _res: Response, next) => {
    logger.http(`${req.method} ${req.path}`);
    next();
});

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

// 404 handler
app.use((_req: Request, res: Response) => {
    res.status(404).json({
        success: false,
        message: 'Resource not found',
    });
});


// Global error handler
app.use(errorHandler);

export default app;
