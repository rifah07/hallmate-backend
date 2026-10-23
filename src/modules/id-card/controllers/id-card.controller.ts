import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '@/shared/utils/response.util';
import idCardService from '../services/id-card.service';

class IdCardController {
  async myCard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      sendSuccess(res, await idCardService.myCard(req.user!.userId));
    } catch (error) {
      next(error);
    }
  }

  async verify(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      sendSuccess(res, await idCardService.verify(req.body.token));
    } catch (error) {
      next(error);
    }
  }
}

export default new IdCardController();
