import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '@/shared/utils/response.util';
import noticeService from '../services/notice.service';
import { ListNoticesQuery } from '../validations/notice.validation';

class NoticeController {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { limit, cursor } = req.query as unknown as ListNoticesQuery;
      sendSuccess(res, await noticeService.list(req.user!, limit, cursor));
    } catch (error) {
      next(error);
    }
  }

  async get(req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> {
    try {
      sendSuccess(res, await noticeService.get(req.user!, req.params.id));
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      sendSuccess(
        res,
        await noticeService.create(req.user!, req.body, req.file),
        'Notice published',
        201,
      );
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> {
    try {
      sendSuccess(
        res,
        await noticeService.update(req.user!, req.params.id, req.body, req.file),
        'Notice updated',
      );
    } catch (error) {
      next(error);
    }
  }

  async withdraw(req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> {
    try {
      await noticeService.withdraw(req.user!, req.params.id);
      sendSuccess(res, null, 'Notice withdrawn');
    } catch (error) {
      next(error);
    }
  }
}

export default new NoticeController();
