import { Request, Response, NextFunction } from 'express';
import roomService from '../services/room.service';
import { sendSuccess } from '@/shared/utils/response.util';

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
}

export default new RoomController();
