import request from 'supertest';
import app from '@/app';
import prisma from '@/config/database.config';
import { hashPassword } from '@/shared/utils/crypto/password.util';
import { UserRole } from '@prisma/client';

// The web app shows a dedicated page for a cancelled seat or a removed
// account, driven by error.code. The reason is only shown to her.

const IDS = { provost: '7900000001', cancelled: '7900000002', removed: '7900000003' };
const ALL = Object.values(IDS);
const PASSWORD = 'Secret@123';
const users: Record<string, string> = {};
const tokens: Record<string, string> = {};

const create = async (universityId: string, role: UserRole) =>
  (
    await prisma.user.create({
      data: {
        universityId,
        name: `State ${role}`,
        email: `${universityId}@state.test`,
        phone: '01712345678',
        role,
        password: await hashPassword(PASSWORD),
        isFirstLogin: false,
      },
    })
  ).id;

const login = (universityId: string, password = PASSWORD) =>
  request(app).post('/api/auth/login').send({ universityId, password });

const setStatus = (body: object) =>
  request(app)
    .patch(`/api/users/${users.cancelled}/status`)
    .set('Authorization', `Bearer ${tokens.provost}`)
    .send(body);

const cleanup = async () => {
  await prisma.notification.deleteMany({ where: { user: { universityId: { in: ALL } } } });
  await prisma.refreshToken.deleteMany({ where: { user: { universityId: { in: ALL } } } });
  await prisma.user.deleteMany({ where: { universityId: { in: ALL } } });
};

beforeAll(async () => {
  await cleanup();
  users.provost = await create(IDS.provost, 'PROVOST');
  users.cancelled = await create(IDS.cancelled, 'STUDENT');
  users.removed = await create(IDS.removed, 'STUDENT');
  tokens.provost = (await login(IDS.provost)).body.data.accessToken;
  tokens.cancelled = (await login(IDS.cancelled)).body.data.accessToken;
}, 30000);

afterAll(async () => {
  await cleanup();
  await prisma.$disconnect();
});

describe('Seat cancelled', () => {
  it('needs a reason', async () => {
    expect((await setStatus({ accountStatus: 'SEAT_CANCELLED' })).status).toBe(400);
  });

  it('records reason, actor and date', async () => {
    const res = await setStatus({
      accountStatus: 'SEAT_CANCELLED',
      reason: 'Residency period ended',
    });
    expect(res.status).toBe(200);
    const user = await prisma.user.findUniqueOrThrow({ where: { id: users.cancelled } });
    expect(user.cancellationReason).toBe('Residency period ended');
    expect(user.cancelledBy).toBe(users.provost);
    expect(user.cancelledAt).toBeInstanceOf(Date);
  });

  it('her open session gets the coded error with the reason', async () => {
    const res = await request(app)
      .get('/api/auth/profile')
      .set('Authorization', `Bearer ${tokens.cancelled}`);
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('ACCOUNT_SEAT_CANCELLED');
    expect(res.body.error.details.reason).toBe('Residency period ended');
  });

  it('login with her password explains; a wrong password reveals nothing', async () => {
    const right = await login(IDS.cancelled);
    expect(right.status).toBe(403);
    expect(right.body.error.code).toBe('ACCOUNT_SEAT_CANCELLED');

    const wrong = await login(IDS.cancelled, 'Wrong@123');
    expect(wrong.status).toBe(401);
    expect(wrong.body.error.code).toBeUndefined();
  });

  it('reactivating clears the old reason', async () => {
    expect((await setStatus({ accountStatus: 'ACTIVE' })).status).toBe(200);
    const user = await prisma.user.findUniqueOrThrow({ where: { id: users.cancelled } });
    expect(user.cancellationReason).toBeNull();
    expect((await login(IDS.cancelled)).status).toBe(200);
  });
});

describe('Account removed', () => {
  it('right password: ACCOUNT_REMOVED; wrong password: generic', async () => {
    await prisma.user.update({
      where: { id: users.removed },
      data: { isDeleted: true, deletedAt: new Date() },
    });
    const right = await login(IDS.removed);
    expect(right.status).toBe(403);
    expect(right.body.error.code).toBe('ACCOUNT_REMOVED');
    expect((await login(IDS.removed, 'Wrong@123')).body.error.code).toBeUndefined();
  });
});
