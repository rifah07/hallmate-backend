import { Request, Response, NextFunction } from 'express';
import userService from '../services/user.service';
import { sendSuccess, sendPaginatedSuccess } from '@/shared/utils/response.util';
import { AppError } from '@/shared/errors';
import { UserRole } from '@prisma/client';

class UserController {
  constructor() {
    this.getUserById = this.getUserById.bind(this);
    this.getUserByUniversityId = this.getUserByUniversityId.bind(this);
    this.getAllUsers = this.getAllUsers.bind(this);
    this.createUser = this.createUser.bind(this);
    this.updateUser = this.updateUser.bind(this);
    this.updateUserRole = this.updateUserRole.bind(this);
    this.updateAccountStatus = this.updateAccountStatus.bind(this);
    this.deleteUser = this.deleteUser.bind(this);
    this.restoreUser = this.restoreUser.bind(this);
    this.getUserStatistics = this.getUserStatistics.bind(this);
    this.bulkCreateUsers = this.bulkCreateUsers.bind(this);
    this.getUsersByRole = this.getUsersByRole.bind(this);
    this.getUsersByFloor = this.getUsersByFloor.bind(this);
    this.uploadProfilePicture = this.uploadProfilePicture.bind(this);
    this.deleteProfilePicture = this.deleteProfilePicture.bind(this);
  }

  /**
   * GET /api/users/:userId
   */
  async getUserById(
    req: Request<{ userId: string }>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { userId } = req.params;
      const user = await userService.getUserById(userId);
      sendSuccess(res, user, 'User retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/users/university/:universityId
   */
  async getUserByUniversityId(
    req: Request<{ universityId: string }>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { universityId } = req.params;
      const user = await userService.getUserByUniversityId(universityId);
      sendSuccess(res, user, 'User retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/users
   * Supports: ?role, ?accountStatus, ?department, ?year, ?program,
   *           ?assignedFloor, ?search, ?page, ?limit, ?sortBy, ?sortOrder
   */
  async getAllUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        role,
        accountStatus,
        department,
        year,
        program,
        assignedFloor,
        search,
        page,
        limit,
        sortBy,
        sortOrder,
      } = req.query;

      const filters = {
        role: role as UserRole,
        accountStatus: accountStatus as any,
        department: department as string | undefined,
        year: year ? parseInt(year as string) : undefined,
        program: program as any,
        assignedFloor: assignedFloor ? parseInt(assignedFloor as string) : undefined,
        search: search as string | undefined,
      };

      const pagination = {
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 20,
        sortBy: (sortBy as string) || 'createdAt',
        sortOrder: (sortOrder as 'asc' | 'desc') || 'desc',
      };

      const result = await userService.getAllUsers(filters, pagination);
      sendPaginatedSuccess(res, result.users, result.pagination);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/users
   * Admin only — authorization handled by middleware
   */
  async createUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await userService.createUser(req.body);
      sendSuccess(res, user, 'User created successfully. One-time password sent to email.', 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/users/:userId
   */
  async updateUser(
    req: Request<{ userId: string }>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) throw new AppError('User not authenticated', 401);

      const { userId } = req.params;
      const user = await userService.updateUser(userId, req.body, req.user.userId);
      sendSuccess(res, user, 'User updated successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/users/:userId/role
   * Super admin only — authorization handled by middleware
   */
  async updateUserRole(
    req: Request<{ userId: string }>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { userId } = req.params;
      const { role } = req.body;
      const user = await userService.updateUserRole(userId, role);
      sendSuccess(res, user, 'User role updated successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/users/:userId/status
   * Admin only — authorization handled by middleware
   */
  async updateAccountStatus(
    req: Request<{ userId: string }>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { userId } = req.params;
      const { accountStatus } = req.body;
      const user = await userService.updateAccountStatus(userId, accountStatus);
      sendSuccess(res, user, 'Account status updated successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/users/:userId
   * Admin only — authorization handled by middleware
   */
  async deleteUser(
    req: Request<{ userId: string }>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) throw new AppError('User not authenticated', 401);

      const { userId } = req.params;
      await userService.deleteUser(userId, req.user.userId);
      sendSuccess(res, null, 'User deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/users/:userId/restore
   * Super admin only — authorization handled by middleware
   */
  async restoreUser(
    req: Request<{ userId: string }>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { userId } = req.params;
      const user = await userService.restoreUser(userId);
      sendSuccess(res, user, 'User restored successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/users/statistics
   * Admin only — authorization handled by middleware
   */
  async getUserStatistics(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const statistics = await userService.getUserStatistics();
      sendSuccess(res, statistics, 'User statistics retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/users/bulk
   * Admin only — authorization handled by middleware
   */
  async bulkCreateUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { users } = req.body;
      const result = await userService.bulkCreateUsers(users);
      sendSuccess(res, result, `Successfully created ${result.created} users.`, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/users/role/:role
   */
  async getUsersByRole(
    req: Request<{ role: string }>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { role } = req.params;
      const users = await userService.getUsersByRole(role);
      sendSuccess(res, users, 'Users retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/users/floor/:floor
   * House tutor and above — authorization handled by middleware
   */
  async getUsersByFloor(
    req: Request<{ floor: string }>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const floorNumber = parseInt(req.params.floor, 10); //string → decimal number
      const users = await userService.getUsersByFloor(floorNumber);
      sendSuccess(res, users, 'Users retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/users/:userId/profile-picture
   */
  async uploadProfilePicture(
    req: Request<{ userId: string }>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) throw new AppError('User not authenticated', 401);

      const { userId } = req.params;
      const file = (req as any).file as Express.Multer.File | undefined;

      if (!file) throw new AppError('No file uploaded', 400);

      const user = await userService.uploadProfilePicture(userId, file, req.user.role as UserRole);
      sendSuccess(res, user, 'Profile picture uploaded successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/users/:userId/profile-picture
   */
  async deleteProfilePicture(
    req: Request<{ userId: string }>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) throw new AppError('User not authenticated', 401);

      const { userId } = req.params;
      const user = await userService.deleteProfilePicture(userId, req.user.role as UserRole);
      sendSuccess(res, user, 'Profile picture deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/users/:userId/profile-picture/optimized
   * Returns optimized Cloudinary URL — no DB call, just URL transformation
   */
  async getOptimizedProfilePicture(
    req: Request<{ userId: string }>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { width, height, quality } = req.query;
      const { profilePictureUrl } = req.body;

      if (!profilePictureUrl) throw new AppError('profilePictureUrl is required', 400);

      const optimizedUrl = userService.getOptimizedProfilePicture(profilePictureUrl, {
        width: width ? parseInt(width as string) : undefined,
        height: height ? parseInt(height as string) : undefined,
        quality: quality as string | undefined,
      });

      sendSuccess(res, { url: optimizedUrl }, 'Optimized URL generated');
    } catch (error) {
      next(error);
    }
  }
}

export default new UserController();
