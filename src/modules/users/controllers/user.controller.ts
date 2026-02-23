import { Request, Response, NextFunction } from 'express';
import userService from '../services/user.service';
import { sendSuccess, sendPaginatedSuccess } from '@/shared/utils/response.util';

class UserController {
  constructor() {
    this.getUserById = this.getUserById.bind(this);
    this.getUserByUniversityId = this.getUserByUniversityId.bind(this);
    this.getAllUsers = this.getAllUsers.bind(this);
    this.createUser = this.createUser.bind(this);
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
        role: role as any,
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
}

export default new UserController();
