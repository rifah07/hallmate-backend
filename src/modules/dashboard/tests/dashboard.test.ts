import request from 'supertest';
import app from '@/app';
import prisma from '@/config/database.config';
import { hashPassword } from '@/shared/utils/crypto/password.util';
import { UserRole } from '@prisma/client';

const IDS = {
  provost: '8500000001',
  tutor: '8500000002',
  guard: '8500000003',
  cook: '8500000004',
  mim: '8500000005',
  nila: '8500000006',
};
const ALL = Object.values(IDS);
const PASSWORD = 'Secret@123';
const ROOM = 'DB-1201';
const users: Record<string, string> = {};
const tokens: Record<string, string> = {};
const as = (who: string) => ({ Authorization: `Bearer ${tokens[who]}` });
const dashboard = async (who: string) =>
  (await request(app).get('/api/dashboard').set(as(who))).body.data;

const cleanup = async () => {
  await prisma.roomOccupant.deleteMany({ where: { user: { universityId: { in: ALL } } } });
  await prisma.refreshToken.deleteMany({ where: { user: { universityId: { in: ALL } } } });
  await prisma.user.deleteMany({ where: { universityId: { in: ALL } } });
  await prisma.room.deleteMany({ where: { roomNumber: ROOM } });
};

beforeAll(async () => {
  await cleanup();
  const roles: [string, UserRole, Record<string, unknown>?][] = [
    ['provost', 'PROVOST'],
    ['tutor', 'HOUSE_TUTOR', { assignedFloor: 12 }],
    ['guard', 'GUARD'],
    ['cook', 'DINING_STAFF'],
    ['mim', 'STUDENT'],
    ['nila', 'STUDENT'],
  ];
  for (const [key, role, extras] of roles) {
    users[key] = (
      await prisma.user.create({
        data: {
          universityId: IDS[key as keyof typeof IDS],
          name: `Dash ${key}`,
          email: `${key}@dash.test`,
          phone: '01712345678',
          role,
          password: await hashPassword(PASSWORD),
          isFirstLogin: false,
          ...extras,
        },
      })
    ).id;
    tokens[key] = (
      await request(app)
        .post('/api/auth/login')
        .send({ universityId: IDS[key as keyof typeof IDS], password: PASSWORD })
    ).body.data.accessToken;
  }
  const room = await prisma.room.create({
    data: { roomNumber: ROOM, floor: 12, wing: 'A', roomType: 'DOUBLE', capacity: 2 },
  });
  for (const [who, bed] of [
    ['mim', 1],
    ['nila', 2],
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

describe('Dashboard', () => {
  it('a student sees her room and roommates by name only', async () => {
    const d = await dashboard('mim');
    expect(d.room).toMatchObject({ roomNumber: ROOM, floor: 12, bedNumber: 1 });
    expect(d.room.roommates).toEqual([{ name: 'Dash nila', bedNumber: 2 }]);
    expect(d.unpaidBills).toEqual({ count: 0, total: 0 });
    expect(d).not.toHaveProperty('occupancy');
  });

  it('a house tutor sees her floor', async () => {
    const d = await dashboard('tutor');
    expect(d.scope).toEqual({ floor: 12 });
    expect(d.occupancy).toEqual({ beds: 2, occupied: 2, vacant: 0, rate: 100 });
  });

  it('the provost sees the hall and the renewal collection', async () => {
    const d = await dashboard('provost');
    expect(d.scope).toBe('hall');
    expect(d.renewal).toHaveProperty('outstanding');
  });

  it('the guard sees today at the gate; support staff only the basics', async () => {
    expect((await dashboard('guard')).visitorsToday).toEqual({ expected: 0, inside: 0, left: 0 });
    expect(Object.keys(await dashboard('cook')).sort()).toEqual([
      'latestNotices',
      'unreadNotifications',
    ]);
  });
});
