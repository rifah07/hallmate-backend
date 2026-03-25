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

  // ============================================================================
  // GET MY FLOOR ROOMS (House Tutor)
  // ============================================================================

  async getMyFloorRooms(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userContext: UserContext = {
        userId: req.user!.userId,
        role: req.user!.role,
        assignedFloor: req.user!.assignedFloor,
      };

      const rooms = await roomService.getMyFloorRooms(userContext);
      sendSuccess(res, { rooms, count: rooms.length, floor: req.user!.assignedFloor });
    } catch (error) {
      next(error);
    }
  }

  // ============================================================================
  // GET ROOMS BY FLOOR
  // ============================================================================

  async getRoomsByFloor(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const floor = parseInt(String(req.params.floor), 10);

      const userContext: UserContext = {
        userId: req.user!.userId,
        role: req.user!.role,
        assignedFloor: req.user!.assignedFloor,
      };

      const rooms = await roomService.getRoomsByFloor(floor, userContext);
      sendSuccess(res, { rooms, count: rooms.length, floor });
    } catch (error) {
      next(error);
    }
  }

  // ============================================================================
  // GET ROOMS BY TYPE
  // ============================================================================

  async getRoomsByType(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const roomType = req.params.type as RoomType;

      const userContext: UserContext = {
        userId: req.user!.userId,
        role: req.user!.role,
        assignedFloor: req.user!.assignedFloor,
      };

      const rooms = await roomService.getRoomsByType(roomType, userContext);
      sendSuccess(res, { rooms, count: rooms.length, roomType });
    } catch (error) {
      next(error);
    }
  }

  // ============================================================================
  // GET ROOM BY ID
  // ============================================================================

  async getRoomById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userContext: UserContext = {
        userId: req.user!.userId,
        role: req.user!.role,
        assignedFloor: req.user!.assignedFloor,
      };

      const room = await roomService.getRoomById(String(req.params.roomId), userContext);
      sendSuccess(res, room);
    } catch (error) {
      next(error);
    }
  }

  // ============================================================================
  // UPDATE ROOM
  // ============================================================================

  async updateRoom(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const room = await roomService.updateRoom(String(req.params.roomId), req.body);
      sendSuccess(res, room, 'Room updated successfully');
    } catch (error) {
      next(error);
    }
  }

  // ============================================================================
  // DELETE ROOM
  // ============================================================================

  async deleteRoom(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await roomService.deleteRoom(String(req.params.roomId));
      sendSuccess(res, null, 'Room deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  // ============================================================================
  // ASSIGN STUDENT
  // ============================================================================

  async assignStudent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userContext: UserContext = {
        userId: req.user!.userId,
        role: req.user!.role,
        assignedFloor: req.user!.assignedFloor,
      };

      const room = await roomService.assignStudent(
        String(req.params.roomId),
        req.body,
        userContext,
      );
      sendSuccess(res, room, 'Student assigned successfully');
    } catch (error) {
      next(error);
    }
  }

  // ============================================================================
  // UNASSIGN STUDENT
  // ============================================================================

  async unassignStudent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userContext: UserContext = {
        userId: req.user!.userId,
        role: req.user!.role,
        assignedFloor: req.user!.assignedFloor,
      };

      const room = await roomService.unassignStudent(
        String(req.params.roomId),
        String(req.params.userId),
        userContext,
      );
      sendSuccess(res, room, 'Student unassigned successfully');
    } catch (error) {
      next(error);
    }
  }

  // ============================================================================
  // TRANSFER STUDENT
  // ============================================================================

  async transferStudent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userContext: UserContext = {
        userId: req.user!.userId,
        role: req.user!.role,
        assignedFloor: req.user!.assignedFloor,
      };

      const room = await roomService.transferStudent(
        String(req.params.roomId),
        req.body,
        userContext,
      );
      sendSuccess(res, room, 'Student transferred successfully');
    } catch (error) {
      next(error);
    }
  }

  // ============================================================================
  // GET STATISTICS
  // ============================================================================

  async getStatistics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userContext: UserContext = {
        userId: req.user!.userId,
        role: req.user!.role,
        assignedFloor: req.user!.assignedFloor,
      };

      const statistics = await roomService.getStatistics(userContext);
      sendSuccess(res, statistics);
    } catch (error) {
      next(error);
    }
  }
}

export default new RoomController();
