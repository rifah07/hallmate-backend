import { Request, Response, NextFunction } from 'express';
import { env } from '@/config/env.config';
import { sendSuccess } from '@/shared/utils/response.util';
import logger from '@/shared/utils/logger.util';
import billingService from '../services/billing.service';
import { gatewayCallbackSchema, ListBillsQuery } from '../validations/billing.validation';

const resultPage = (status: string, billId?: string) =>
  `${env.WEB_APP_URL}/payments/result?status=${status}${billId ? `&bill=${billId}` : ''}`;

class BillingController {
  async issueRenewals(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      sendSuccess(
        res,
        await billingService.issueRenewals(req.user!, req.body),
        'Renewal bills issued',
        201,
      );
    } catch (error) {
      next(error);
    }
  }

  async issueBill(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      sendSuccess(res, await billingService.issueBill(req.user!, req.body), 'Bill issued', 201);
    } catch (error) {
      next(error);
    }
  }

  async listMine(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { limit, cursor } = req.query as unknown as ListBillsQuery;
      sendSuccess(res, await billingService.listMine(req.user!, limit, cursor));
    } catch (error) {
      next(error);
    }
  }

  async listAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { limit, cursor, status, period } = req.query as unknown as ListBillsQuery;
      sendSuccess(res, await billingService.listAll({ status, period }, limit, cursor));
    } catch (error) {
      next(error);
    }
  }

  async cancel(req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> {
    try {
      await billingService.cancel(req.params.id);
      sendSuccess(res, null, 'Bill cancelled');
    } catch (error) {
      next(error);
    }
  }

  async pay(req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> {
    try {
      sendSuccess(res, await billingService.startPayment(req.user!, req.params.id));
    } catch (error) {
      next(error);
    }
  }

  async recordPayment(
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      await billingService.recordManualPayment(req.user!, req.params.id, req.body);
      sendSuccess(res, null, 'Payment recorded');
    } catch (error) {
      next(error);
    }
  }

  /** Server-to-server notice from SSLCommerz. Answers 200 so it stops retrying. */
  async ipn(req: Request, res: Response): Promise<void> {
    const parsed = gatewayCallbackSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false });
      return;
    }
    try {
      await billingService.confirmOnlinePayment(parsed.data.val_id);
      res.status(200).json({ success: true });
    } catch (error) {
      logger.error('IPN could not be confirmed', { error });
      res.status(200).json({ success: false }); // retrying won't change a bad payment
    }
  }

  /**
   * The payer's browser comes back here. success re-runs the same verified
   * confirmation (the IPN may be late, or unreachable on localhost); fail and
   * cancel change nothing, since anyone could post them for any payment.
   */
  async returnFromGateway(req: Request<{ outcome: string }>, res: Response): Promise<void> {
    const { outcome } = req.params;
    if (outcome !== 'success') {
      res.redirect(303, resultPage(outcome === 'cancel' ? 'cancelled' : 'failed'));
      return;
    }
    const parsed = gatewayCallbackSchema.safeParse(req.body);
    try {
      if (!parsed.success) throw new Error('missing val_id');
      const billId = await billingService.confirmOnlinePayment(parsed.data.val_id);
      res.redirect(303, resultPage('paid', billId));
    } catch (error) {
      logger.error('Payment return could not be confirmed', { error });
      res.redirect(303, resultPage('unverified'));
    }
  }
}

export default new BillingController();
