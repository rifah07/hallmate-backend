/**
 * Base Application Error
 * All custom errors extend this class
 */
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 400 Bad Request
 * Used when the request is malformed or contains invalid data
 */
export class BadRequestError extends AppError {
  constructor(message: string = 'Bad request') {
    super(message, 400);
  }
}

/**
 * 401 Unauthorized
 * Used when authentication is required or has failed
 */
export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401);
  }
}

/**
 * 403 Forbidden
 * Used when the user is authenticated but doesn't have permission
 */
export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 403);
  }
}

/**
 * 404 Not Found
 * Used when a requested resource doesn't exist
 */
export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404);
  }
}

/**
 * 409 Conflict
 * Used when there's a conflict with the current state (e.g., duplicate entries)
 */
export class ConflictError extends AppError {
  constructor(message: string = 'Conflict') {
    super(message, 409);
  }
}

/**
 * 422 Unprocessable Entity
 * Used when the request is well-formed but contains semantic errors
 */
export class UnprocessableEntityError extends AppError {
  constructor(message: string = 'Unprocessable entity') {
    super(message, 422);
  }
}

/**
 * 429 Too Many Requests
 * Used when rate limiting is triggered
 */
export class TooManyRequestsError extends AppError {
  constructor(message: string = 'Too many requests') {
    super(message, 429);
  }
}

/**
 * 500 Internal Server Error
 * Used for unexpected server errors
 */
export class InternalServerError extends AppError {
  constructor(message: string = 'Internal server error') {
    super(message, 500);
  }
}

/**
 * 503 Service Unavailable
 * Used when the service is temporarily unavailable
 */
export class ServiceUnavailableError extends AppError {
  constructor(message: string = 'Service unavailable') {
    super(message, 503);
  }
}

/**
 * Validation Error
 * Used for validation failures (can be extended with details)
 */
export class ValidationError extends BadRequestError {
  details?: any;

  constructor(message: string = 'Validation failed', details?: any) {
    super(message);
    this.details = details;
  }
}

/**
 * Database Error
 * Used for database-related errors
 */
export class DatabaseError extends InternalServerError {
  constructor(message: string = 'Database error occurred') {
    super(message);
  }
}

/**
 * Authentication Error
 * Used for authentication-specific failures
 */
export class AuthenticationError extends UnauthorizedError {
  constructor(message: string = 'Authentication failed') {
    super(message);
  }
}

/**
 * Token Error
 * Used for JWT token-related errors
 */
export class TokenError extends UnauthorizedError {
  constructor(message: string = 'Invalid or expired token') {
    super(message);
  }
}

/**
 * Type guard to check if error is operational
 */
export function isOperationalError(error: Error): boolean {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
}
