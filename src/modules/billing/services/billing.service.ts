import { BillStatus } from '@prisma/client';
import { env } from '@/config/env.config';
import { AppError, BadRequestError, NotFoundError } from '@/shared/errors';
import { JWTPayload } from '@/shared/utils/crypto/jwt.util';
import { decodeCursor, toPage } from '@/shared/utils/cursor.util';
import logger from '@/shared/utils/logger.util';
import { notificationService } from '@/modules/notifications';
import notificationRepository from '@/modules/notifications/repositories/notification.repository';
import billingRepository from '../repositories/billing.repository';
import { PaymentGateway } from '../gateways/payment-gateway';
import { sslCommerzGateway } from '../gateways/sslcommerz.gateway';
import {
  IssueBillInput,
  IssueRenewalInput,
  RecordPaymentInput,
} from '../validations/billing.validation';

const taka = (amount: number) => `৳${amount.toLocaleString('en-IN')}`;

// Overdue is derived, not stored: no nightly job, never out of date
const withOverdue = <T extends { status: BillStatus; dueDate: Date }>(bill: T) => ({
  ...bill,
  isOverdue: bill.status === 'UNPAID' && bill.dueDate < new Date(),
});

export class BillingService {
  // The gateway is injected so tests can use a fake one (no network)
  constructor(private readonly gateway: PaymentGateway = sslCommerzGateway) {}

  /** One seat-renewal bill per resident for a year. Safe to run twice. */
  async issueRenewals(admin: JWTPayload, input: IssueRenewalInput) {
    const period = String(input.year);
    const [residents, alreadyBilled] = await Promise.all([
      billingRepository.findResidentIds(),
      billingRepository.findBilledStudentIds('SEAT_RENEWAL', period),
    ]);
    const toBill = residents.filter((id) => !alreadyBilled.has(id));
    const title = `Seat renewal ${period}`;
    const created = await billingRepository.createBills(toBill, {
      type: 'SEAT_RENEWAL',
      title,
      period,
      amount: input.amount,
      dueDate: input.dueDate,
      createdBy: admin.userId,
    });
    await notificationService.notify(toBill, {
      type: 'BILL_ISSUED',
      title,
      message: `Your ${title.toLowerCase()} fee of ${taka(input.amount)} is due by ${input.dueDate.toDateString()}.`,
      entityType: 'Bill',
    });
    return { created, skipped: residents.length - toBill.length };
  }

  /** A single bill (a fine, a replacement key...) for one student. */
  async issueBill(admin: JWTPayload, input: IssueBillInput) {
    const created = await billingRepository.createBills([input.studentId], {
      type: input.type,
      title: input.title,
      period: input.period,
      amount: input.amount,
      dueDate: input.dueDate,
      createdBy: admin.userId,
    });
    if (created === 0)
      throw new BadRequestError('This student already has that bill for this period');
    await notificationService.notify([input.studentId], {
      type: 'BILL_ISSUED',
      title: input.title,
      message: `A bill of ${taka(input.amount)} is due by ${input.dueDate.toDateString()}.`,
      entityType: 'Bill',
    });
    return { created };
  }

  async listMine(student: JWTPayload, limit: number, cursor?: string) {
    const page = toPage(
      await billingRepository.listBills({ studentId: student.userId }, limit, decodeCursor(cursor)),
      limit,
    );
    return { ...page, items: page.items.map(withOverdue) };
  }

  async listAll(filter: { status?: BillStatus; period?: string }, limit: number, cursor?: string) {
    const page = toPage(
      await billingRepository.listBills(filter, limit, decodeCursor(cursor)),
      limit,
    );
    return { ...page, items: page.items.map(withOverdue) };
  }

  async cancel(billId: string) {
    if (!(await billingRepository.cancelBill(billId))) {
      throw new BadRequestError('Only an unpaid bill can be cancelled');
    }
  }

  /** Starts an online payment. Returns the gateway page to redirect to. */
  async startPayment(student: JWTPayload, billId: string) {
    if (!this.gateway.isConfigured) {
      throw new AppError(
        'Online payment is not available yet. Please pay at the hall office.',
        503,
      );
    }
    const bill = await billingRepository.findBill(billId);
    // Same 404 whether the bill doesn't exist or isn't hers
    if (!bill || bill.studentId !== student.userId) throw new NotFoundError('Bill not found');
    if (bill.status !== 'UNPAID') throw new BadRequestError('This bill is not payable');

    const payer = await billingRepository.findPayer(student.userId);
    // The amount comes from the bill in our database, never from the request
    const payment = await billingRepository.createPayment({
      billId,
      studentId: student.userId,
      amount: bill.amount,
      gateway: 'SSLCOMMERZ',
    });
    const back = (outcome: string) =>
      `${env.API_PUBLIC_URL}/api/billing/sslcommerz/return/${outcome}`;
    const redirectUrl = await this.gateway.createCheckout({
      tranId: payment.id,
      amount: bill.amount,
      productName: bill.title,
      customer: { name: payer!.name, email: payer!.email, phone: payer!.phone },
      successUrl: back('success'),
      failUrl: back('fail'),
      cancelUrl: back('cancel'),
      ipnUrl: `${env.API_PUBLIC_URL}/api/billing/sslcommerz/ipn`,
    });
    return { redirectUrl };
  }

  /**
   * Called from the IPN and from the success return. Neither request is
   * trusted: anyone can POST to those URLs. What counts is the gateway's own
   * answer to our server-to-server verify call, and that its amount and
   * currency match the bill exactly.
   */
  async confirmOnlinePayment(validationId: string): Promise<string> {
    const verified = await this.gateway.verify(validationId);
    const payment = await billingRepository.findPayment(verified.tranId);
    if (!payment) throw new NotFoundError('Payment not found');
    if (verified.amount !== payment.amount || verified.currency !== 'BDT') {
      logger.error('Payment amount mismatch', { paymentId: payment.id, verified: verified.amount });
      throw new BadRequestError('Payment amount does not match the bill');
    }

    const result = await billingRepository.markPaid(payment.id, {
      method: verified.method,
      reference: validationId,
      gatewayResponse: verified.raw,
    });
    await this.afterPayment(result, payment);
    return payment.billId;
  }

  /** Cash or a bank slip, recorded by the provost. */
  async recordManualPayment(admin: JWTPayload, billId: string, input: RecordPaymentInput) {
    const bill = await billingRepository.findBill(billId);
    if (!bill) throw new NotFoundError('Bill not found');
    if (bill.status !== 'UNPAID') throw new BadRequestError('This bill is not payable');
    const payment = await billingRepository.createPayment({
      billId,
      studentId: bill.studentId,
      amount: bill.amount,
      gateway: input.gateway,
    });
    const result = await billingRepository.markPaid(payment.id, {
      reference: input.reference,
      recordedBy: admin.userId,
    });
    await this.afterPayment(result, payment);
  }

  private async afterPayment(
    result: 'paid' | 'duplicate' | 'already-processed',
    payment: { id: string; billId: string; studentId: string; amount: number },
  ) {
    if (result === 'paid') {
      await notificationService.notify(
        [payment.studentId],
        {
          type: 'PAYMENT_RECEIVED',
          title: 'Payment received',
          message: `We received ${taka(payment.amount)}. Receipt number: ${payment.id}.`,
          entityType: 'Bill',
          entityId: payment.billId,
        },
        { email: true }, // a receipt is worth an email
      );
    }
    if (result === 'duplicate') {
      logger.warn('Bill paid twice, refund needed', {
        paymentId: payment.id,
        billId: payment.billId,
      });
      const provosts = await notificationRepository.findStaffForStudent(payment.studentId);
      await notificationService.notify(provosts, {
        type: 'PAYMENT_RECEIVED',
        title: 'Duplicate payment: refund needed',
        message: `A bill was paid twice (${taka(payment.amount)}). Payment ${payment.id} should be refunded.`,
        entityType: 'Bill',
        entityId: payment.billId,
      });
    }
  }
}

export default new BillingService();
