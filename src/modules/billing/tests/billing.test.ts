import request from 'supertest';
import { UserRole } from '@prisma/client';
import type { VerifiedPayment } from '../gateways/payment-gateway';

// A fake gateway: no network, and the test decides what "the gateway confirms".
const confirmed = new Map<string, Omit<VerifiedPayment, 'raw'>>();
const fakeGateway = {
  isConfigured: true,
  createCheckout: jest.fn(async (r: { tranId: string }) => `https://gateway.test/pay/${r.tranId}`),
  verify: jest.fn(async (valId: string) => {
    const payment = confirmed.get(valId);
    if (!payment)
      throw Object.assign(new Error('Payment could not be verified'), { statusCode: 400 });
    return { ...payment, raw: { val_id: valId } };
  }),
};
jest.mock('@/modules/billing/gateways/sslcommerz.gateway', () => ({
  sslCommerzGateway: fakeGateway,
}));

import app from '@/app';
import prisma from '@/config/database.config';
import { hashPassword } from '@/shared/utils/crypto/password.util';

const IDS = { provost: '8200000001', alice: '8200000002', bina: '8200000003', guest: '8200000004' };
const ALL = Object.values(IDS);
const PASSWORD = 'Secret@123';
const ROOM = 'BL-801';
const YEAR = 2031;
const users: Record<string, string> = {};
const tokens: Record<string, string> = {};

const create = async (universityId: string, role: UserRole) =>
  (
    await prisma.user.create({
      data: {
        universityId,
        name: `Bill ${universityId.slice(-1)}`,
        email: `${universityId}@bill.test`,
        phone: '01712345678',
        role,
        password: await hashPassword(PASSWORD),
        isFirstLogin: false,
      },
    })
  ).id;

const as = (who: string) => ({ Authorization: `Bearer ${tokens[who]}` });
const billOf = (who: string) =>
  prisma.bill.findFirstOrThrow({ where: { studentId: users[who], period: String(YEAR) } });
const ipn = (valId: string) =>
  request(app).post('/api/billing/sslcommerz/ipn').type('form').send({ val_id: valId });
const pay = async (who: string) => {
  const bill = await billOf(who);
  const res = await request(app).post(`/api/billing/bills/${bill.id}/pay`).set(as(who));
  return { bill, res, tranId: String(res.body.data?.redirectUrl).split('/').pop()! };
};

const cleanup = async () => {
  const where = { student: { universityId: { in: ALL } } };
  await prisma.payment.deleteMany({ where });
  await prisma.bill.deleteMany({ where });
  await prisma.roomOccupant.deleteMany({ where: { user: { universityId: { in: ALL } } } });
  await prisma.refreshToken.deleteMany({ where: { user: { universityId: { in: ALL } } } });
  await prisma.user.deleteMany({ where: { universityId: { in: ALL } } });
  await prisma.room.deleteMany({ where: { roomNumber: ROOM } });
};

beforeAll(async () => {
  await cleanup();
  users.provost = await create(IDS.provost, 'PROVOST');
  users.alice = await create(IDS.alice, 'STUDENT');
  users.bina = await create(IDS.bina, 'STUDENT');
  users.guest = await create(IDS.guest, 'STUDENT'); // no bed: not a resident
  for (const key of Object.keys(IDS)) {
    tokens[key] = (
      await request(app)
        .post('/api/auth/login')
        .send({ universityId: IDS[key as keyof typeof IDS], password: PASSWORD })
    ).body.data.accessToken;
  }
  const room = await prisma.room.create({
    data: { roomNumber: ROOM, floor: 8, wing: 'B', roomType: 'DOUBLE', capacity: 2 },
  });
  for (const [who, bed] of [
    ['alice', 1],
    ['bina', 2],
  ] as const) {
    await request(app)
      .post(`/api/rooms/${room.id}/assign`)
      .set(as('provost'))
      .send({ userId: users[who], bedNumber: bed });
  }
}, 60000);

afterAll(async () => {
  await cleanup();
  await prisma.$disconnect();
});

describe('Issuing seat renewals', () => {
  const issue = (who = 'provost') =>
    request(app)
      .post('/api/billing/renewals')
      .set(as(who))
      .send({ year: YEAR, amount: 1500, dueDate: '2031-01-31' });

  it('only the hall admins can issue', async () => {
    expect((await issue('alice')).status).toBe(403);
  });

  it('bills every resident with a bed, once', async () => {
    const first = await issue();
    expect(first.status).toBe(201);
    expect(
      await prisma.bill.count({ where: { period: String(YEAR), studentId: users.guest } }),
    ).toBe(0);
    expect((await billOf('alice')).amount).toBe(1500);

    const again = await issue();
    expect(again.body.data.created).toBe(0); // safe to run twice
    expect(
      await prisma.bill.count({ where: { studentId: users.alice, period: String(YEAR) } }),
    ).toBe(1);
  });
});

describe('Paying online', () => {
  it("can't pay someone else's bill", async () => {
    const bill = await billOf('alice');
    expect(
      (await request(app).post(`/api/billing/bills/${bill.id}/pay`).set(as('bina'))).status,
    ).toBe(404);
  });

  it('answers 503 when no gateway is configured', async () => {
    fakeGateway.isConfigured = false;
    const bill = await billOf('alice');
    expect(
      (await request(app).post(`/api/billing/bills/${bill.id}/pay`).set(as('alice'))).status,
    ).toBe(503);
    fakeGateway.isConfigured = true;
  });

  it('a forged IPN (unknown to the gateway) changes nothing', async () => {
    const { bill } = await pay('alice');
    expect((await ipn('forged-val-id')).body.success).toBe(false);
    expect((await prisma.bill.findUniqueOrThrow({ where: { id: bill.id } })).status).toBe('UNPAID');
  });

  it('a payment of the wrong amount changes nothing', async () => {
    const { bill, tranId } = await pay('alice');
    confirmed.set('val-short', { tranId, amount: 15, currency: 'BDT' });
    await ipn('val-short');
    expect((await prisma.bill.findUniqueOrThrow({ where: { id: bill.id } })).status).toBe('UNPAID');
  });

  it('a "fail" return changes nothing and redirects', async () => {
    const res = await request(app)
      .post('/api/billing/sslcommerz/return/fail')
      .type('form')
      .send({});
    expect(res.status).toBe(303);
    expect(res.headers.location).toContain('status=failed');
  });

  it('a verified payment marks the bill paid, exactly once', async () => {
    const { bill, tranId } = await pay('alice');
    confirmed.set('val-ok', { tranId, amount: 1500, currency: 'BDT', method: 'BKASH-BKash' });

    expect((await ipn('val-ok')).body.success).toBe(true);
    await ipn('val-ok'); // the gateway retries
    const ret = await request(app)
      .post('/api/billing/sslcommerz/return/success')
      .set('Origin', 'https://sandbox.sslcommerz.com') // cross-site form post
      .type('form')
      .send({ val_id: 'val-ok' });
    expect(ret.status).toBe(303);
    expect(ret.headers.location).toContain('status=paid');

    expect((await prisma.bill.findUniqueOrThrow({ where: { id: bill.id } })).status).toBe('PAID');
    expect(await prisma.payment.count({ where: { billId: bill.id, status: 'SUCCESS' } })).toBe(1);
    expect(
      await prisma.notification.count({ where: { userId: users.alice, type: 'PAYMENT_RECEIVED' } }),
    ).toBe(1);
  });

  it('a second payment for a paid bill is flagged for a refund', async () => {
    const pending = await prisma.payment.findFirstOrThrow({
      where: { studentId: users.alice, status: 'PENDING' },
    });
    confirmed.set('val-late', { tranId: pending.id, amount: 1500, currency: 'BDT' });
    await ipn('val-late');
    const flagged = await prisma.notification.count({
      where: { userId: users.provost, title: 'Duplicate payment: refund needed' },
    });
    expect(flagged).toBe(1);
  });
});

describe('Cash and bank payments', () => {
  const record = (who: string, billId: string) =>
    request(app)
      .post(`/api/billing/bills/${billId}/record-payment`)
      .set(as(who))
      .send({ gateway: 'CASH', reference: 'RCPT-0042' });

  it('only the hall admins can record one', async () => {
    const bill = await billOf('bina');
    expect((await record('bina', bill.id)).status).toBe(403);
    expect((await record('provost', bill.id)).status).toBe(200);
    expect((await prisma.bill.findUniqueOrThrow({ where: { id: bill.id } })).status).toBe('PAID');
  });

  it('a paid bill can be neither paid again nor cancelled', async () => {
    const bill = await billOf('bina');
    expect((await record('provost', bill.id)).status).toBe(400);
    expect(
      (await request(app).post(`/api/billing/bills/${bill.id}/cancel`).set(as('provost'))).status,
    ).toBe(400);
  });
});

describe('Listing', () => {
  it('a student sees only her bills, with overdue computed', async () => {
    const res = await request(app).get('/api/billing/my-bills').set(as('bina'));
    expect(res.status).toBe(200);
    expect(
      res.body.data.items.every((b: { studentId: string }) => b.studentId === users.bina),
    ).toBe(true);
    expect(res.body.data.items[0]).toHaveProperty('isOverdue', false);
  });
});
