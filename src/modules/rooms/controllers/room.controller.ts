import { Request, Response, NextFunction } from 'express';
import roomService from '../services/room.service';
import { sendSuccess } from '@/shared/utils/response.util';
import { UserContext } from '../types/room.types';
import { RoomStatus, RoomType } from '@prisma/client';

class RoomController {
  // ============================================================================
  // CREATE ROOM
  // ============================================================================

  async createRoom(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const room = await roomService.createRoom(req.body);
      sendSuccess(res, room, 'Room created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  // ============================================================================
  // GET ALL ROOMS (with filters and pagination)
  // ============================================================================

  async getAllRooms(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters = {
        floor: req.query.floor ? parseInt(req.query.floor as string, 10) : undefined,
        roomType: req.query.roomType as RoomType,
        status: req.query.status as RoomStatus,
        hasVacancy: req.query.hasVacancy ? req.query.hasVacancy === 'true' : undefined,
        search: req.query.search as string | undefined,
      };

      const pagination = {
        page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 20,
        sortBy: req.query.sortBy as string | undefined,
        sortOrder: req.query.sortOrder as 'asc' | 'desc' | undefined,
      };

      const userContext: UserContext = {
        userId: req.user!.userId,
        role: req.user!.role,
        assignedFloor: req.user!.assignedFloor,
      };

      const result = await roomService.getRooms(filters, pagination, userContext);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  // ============================================================================
  // GET VACANT ROOMS
  // ============================================================================

  async getVacantRooms(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const floor = req.query.floor ? parseInt(req.query.floor as string, 10) : undefined;

      const userContext: UserContext = {
        userId: req.user!.userId,
        role: req.user!.role,
        assignedFloor: req.user!.assignedFloor,
      };

      const rooms = await roomService.getVacantRooms(floor, userContext);
      sendSuccess(res, { rooms, count: rooms.length });
    } catch (error) {
      next(error);
    }
  }

  // ============================================================================
  // GET VACANT ROOMS BY FLOOR
  // ============================================================================

  async getVacantRoomsByFloor(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const floor = parseInt(String(req.params.floor), 10);

      const userContext: UserContext = {
        userId: req.user!.userId,
        role: req.user!.role,
        assignedFloor: req.user!.assignedFloor,
      };

      const rooms = await roomService.getVacantRooms(floor, userContext);
      sendSuccess(res, { rooms, count: rooms.length, floor });
    } catch (error) {
      next(error);
    }
  }
}

export default new RoomController();
