import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { MulterError } from 'multer';
import logger from '../utils/logger.util';
import { AppError } from '../errors';

/**
 * Global error handler middleware
 * Handles all errors thrown in the application
 */
export const errorHandler = (err: Error, req: Request, res: Response, _next: NextFunction) => {
  // body-parser marks its own client errors (bad JSON, body too large) with expose + a 4xx status
  const httpErr = err as Error & { expose?: boolean; status?: number };
  const parserError = httpErr.expose === true && !!httpErr.status;
  // Server faults with stack; client mistakes (4xx) as one short line
  const status = err instanceof AppError ? err.statusCode : (parserError && httpErr.status) || 500;
  if (status >= 500) {
    logger.error(`${req.method} ${req.path} ${err.message}`, { name: err.name, stack: err.stack });
  } else {
    logger.warn(`${req.method} ${req.path} ${status} ${err.message}`);
  }

  // Handle custom AppError instances
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        message: err.message,
        ...(err.code && { code: err.code }),
        ...(err.details && { details: err.details }),
      },
    });
  }

  if (parserError) {
    return res.status(status).json({
      success: false,
      error: { message: status === 413 ? 'Request body is too large' : 'Malformed request body' },
    });
  }

  // Handle Prisma errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    return handlePrismaError(err, res);
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Database validation error',
        details: process.env.NODE_ENV === 'development' ? err.message : undefined,
      },
    });
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: {
        message: 'Invalid token',
      },
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: {
        message: 'Token expired',
      },
    });
  }

  // Handle Zod validation errors
  if (err.name === 'ZodError') {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Validation failed',
        details: (err as ZodError).issues,
      },
    });
  }

  // Handle Multer errors (file upload)
  if (err.name === 'MulterError') {
    const multerErr = err as MulterError;
    let message = 'File upload error';

    if (multerErr.code === 'LIMIT_FILE_SIZE') {
      message = 'File size exceeds the allowed limit';
    } else if (multerErr.code === 'LIMIT_FILE_COUNT') {
      message = 'Too many files uploaded';
    } else if (multerErr.code === 'LIMIT_UNEXPECTED_FILE') {
      message = 'Unexpected field in form data';
    }

    return res.status(400).json({
      success: false,
      error: {
        message,
      },
    });
  }

  // Default error (500 Internal Server Error)
  return res.status(500).json({
    success: false,
    error: {
      message: 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { details: err.message, stack: err.stack }),
    },
  });
};

/**
 * Handle Prisma-specific errors
 */
function handlePrismaError(err: Prisma.PrismaClientKnownRequestError, res: Response) {
  switch (err.code) {
    case 'P2002':
      return res.status(409).json({
        success: false,
        error: {
          message: 'A record with this value already exists',
          field: (err.meta?.target as string[])?.join(', '),
        },
      });

    case 'P2025':
      return res.status(404).json({
        success: false,
        error: {
          message: 'Record not found',
        },
      });

    // Foreign key constraint violation
    case 'P2003':
      return res.status(400).json({
        success: false,
        error: {
          message: 'Invalid reference to related record',
          field: err.meta?.field_name,
        },
      });

    case 'P2011':
      return res.status(400).json({
        success: false,
        error: {
          message: 'Required field is missing',
          field: err.meta?.constraint,
        },
      });

    case 'P2000':
      return res.status(400).json({
        success: false,
        error: {
          message: 'Value is too long for the field',
          field: err.meta?.column_name,
        },
      });

    case 'P2018':
      return res.status(404).json({
        success: false,
        error: {
          message: 'Record to delete not found',
        },
      });

    // Default Prisma error
    default:
      return res.status(500).json({
        success: false,
        error: {
          message: 'Database error occurred',
          ...(process.env.NODE_ENV === 'development' && { code: err.code }),
        },
      });
  }
}

export const notFoundHandler = (_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      message: 'Route not found',
    },
  });
};
