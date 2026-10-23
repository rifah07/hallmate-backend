import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '@/shared/utils/response.util';
import visitorService from '../services/visitor.service';
import { ListVisitsQuery } from '../validations/visitor.validation';

type IdRequest = Request<{ id: string }>;

class VisitorController {
  async request(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      sendSuccess(
        res,
        await visitorService.request(req.user!, req.body),
        'Visitor request sent',
        201,
      );
    } catch (error) {
      next(error);
    }
  }

  async listMine(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { limit, cursor } = req.query as unknown as ListVisitsQuery;
      sendSuccess(res, await visitorService.listMine(req.user!, limit, cursor));
    } catch (error) {
      next(error);
    }
  }

  async listPending(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      sendSuccess(res, await visitorService.listPending(req.user!));
    } catch (error) {
      next(error);
    }
  }

  async decide(req: IdRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await visitorService.decide(req.user!, req.params.id, req.body);
      sendSuccess(res, null, 'Decision saved');
    } catch (error) {
      next(error);
    }
  }

  async cancel(req: IdRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await visitorService.cancel(req.user!, req.params.id);
      sendSuccess(res, null, 'Visit cancelled');
    } catch (error) {
      next(error);
    }
  }

  async today(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      sendSuccess(res, await visitorService.today());
    } catch (error) {
      next(error);
    }
  }

  async checkIn(req: IdRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await visitorService.checkIn(req.user!, req.params.id);
      sendSuccess(res, null, 'Checked in');
    } catch (error) {
      next(error);
    }
  }

  async checkOut(req: IdRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await visitorService.checkOut(req.params.id);
      sendSuccess(res, null, 'Checked out');
    } catch (error) {
      next(error);
    }
  }
}

export default new VisitorController();
