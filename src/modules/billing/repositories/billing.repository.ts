import { BillStatus, BillType, PaymentGateway, Prisma } from '@prisma/client';
import prisma from '@/config/database.config';
import { Cursor, olderThan } from '@/shared/utils/cursor.util';

const billSelect = {
  id: true,
  type: true,
  status: true,
  title: true,
  period: true,
  amount: true,
  dueDate: true,
  paidAt: true,
  createdAt: true,
  studentId: true,
  student: { select: { name: true, universityId: true } },
} satisfies Prisma.BillSelect;

class BillingRepository {
  /** Active students who hold a bed: the people a seat renewal is for. */
  async findResidentIds(): Promise<string[]> {
    const rows = await prisma.user.findMany({
      where: {
        role: 'STUDENT',
        isDeleted: false,
        accountStatus: 'ACTIVE',
        roomOccupants: { some: {} },
      },
      select: { id: true },
    });
    return rows.map((r) => r.id);
  }

  async findBilledStudentIds(type: BillType, period: string): Promise<Set<string>> {
    const rows = await prisma.bill.findMany({
      where: { type, period },
      select: { studentId: true },
    });
    return new Set(rows.map((r) => r.studentId));
  }

  async createBills(
    studentIds: string[],
    bill: {
      type: BillType;
      title: string;
      period: string;
      amount: number;
      dueDate: Date;
      createdBy: string;
    },
  ): Promise<number> {
    // skipDuplicates + the unique (student, type, period) index: a retried
    // or double-clicked "issue renewals" can never bill anyone twice
    const { count } = await prisma.bill.createMany({
      data: studentIds.map((studentId) => ({ ...bill, studentId })),
      skipDuplicates: true,
    });
    return count;
  }

  async findBill(id: string) {
    return prisma.bill.findUnique({ where: { id }, select: billSelect });
  }

  async listBills(
    filter: { studentId?: string; status?: BillStatus; period?: string },
    limit: number,
    cursor?: Cursor,
  ) {
    return prisma.bill.findMany({
      where: { ...filter, ...olderThan(cursor) },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
      select: { ...billSelect, student: { select: { name: true, universityId: true } } },
    });
  }

  async cancelBill(id: string): Promise<boolean> {
    const { count } = await prisma.bill.updateMany({
      where: { id, status: 'UNPAID' },
      data: { status: 'CANCELLED' },
    });
    return count > 0;
  }

  async findPayer(studentId: string) {
    return prisma.user.findUnique({
      where: { id: studentId },
      select: { name: true, email: true, phone: true },
    });
  }

  async createPayment(data: {
    billId: string;
    studentId: string;
    amount: number;
    gateway: PaymentGateway;
  }) {
    return prisma.payment.create({ data });
  }

  async findPayment(id: string) {
    return prisma.payment.findUnique({ where: { id } });
  }

  /**
   * The one place money changes state. In a transaction:
   *  - the payment goes PENDING → SUCCESS only if it is still PENDING, so a
   *    repeated IPN or a double return can't apply it twice (idempotent);
   *  - the bill is marked PAID.
   * Returns what happened so the service can notify, or flag a duplicate.
   */
  async markPaid(
    paymentId: string,
    details: { method?: string; reference?: string; gatewayResponse?: object; recordedBy?: string },
  ): Promise<'paid' | 'duplicate' | 'already-processed'> {
    return prisma.$transaction(async (tx) => {
      const paidAt = new Date();
      const { count } = await tx.payment.updateMany({
        where: { id: paymentId, status: 'PENDING' },
        data: {
          status: 'SUCCESS',
          paidAt,
          method: details.method,
          reference: details.reference,
          recordedBy: details.recordedBy,
          gatewayResponse: details.gatewayResponse as Prisma.InputJsonValue | undefined,
        },
      });
      if (count === 0) return 'already-processed';

      const payment = await tx.payment.findUniqueOrThrow({ where: { id: paymentId } });
      const bill = await tx.bill.findUniqueOrThrow({ where: { id: payment.billId } });
      if (bill.status === 'PAID') return 'duplicate'; // paid twice: needs a refund
      await tx.bill.update({ where: { id: bill.id }, data: { status: 'PAID', paidAt } });
      return 'paid';
    });
  }
}

export default new BillingRepository();
