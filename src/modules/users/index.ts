/**
 * User Module - Main Entry Point
 * 
 * This module handles all user management operations including:
 * - CRUD operations for users
 * - Role and permission management
 * - Bulk user creation (JSON and file upload)
 * - Profile picture management
 * - User statistics and analytics
 * - Search and filtering
 * - Soft delete and restore
 */

export { default as userRoutes } from './routes/user.routes';
export { default as userController } from './controllers/user.controller';
export { default as userService } from './services/user.service';
//export { default as UserRepository } from './repositories/user.repository';

// Export types
export * from './types/user.types';

// Export validations
export * from './validations/user.validation';