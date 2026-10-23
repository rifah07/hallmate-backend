import request from 'supertest';
import app from '@/app';
import prisma from '@/config/database.config';
import { hashPassword } from '@/shared/utils/crypto/password.util';
import { UserRole } from '@prisma/client';

const IDS = {
  provost: '7800000001',
  tutor: '7800000002',
  otherTutor: '7800000003',
  a: '7800000004',
  b: '7800000005',
};
const ALL = Object.values(IDS);
const PASSWORD = 'Secret@123';
const ROOM = 'N-401';

const users: Record<string, string> = {};
const tokens: Record<string, string> = {};

const create = async (universityId: string, role: UserRole, extras: Record<string, unknown> = {}) =>
  (
    await prisma.user.create({
      data: {
        universityId,
        name: `Notif ${role}`,
        email: `${universityId}@notif.test`,
        phone: '01712345678',
        role,
        password: await hashPassword(PASSWORD),
        isFirstLogin: false,
        ...extras,
      },
    })
  ).id;

const cleanup = async () => {
  await prisma.notification.deleteMany({ where: { user: { universityId: { in: ALL } } } });
  await prisma.application.deleteMany({ where: { student: { universityId: { in: ALL } } } });
  await prisma.refreshToken.deleteMany({ where: { user: { universityId: { in: ALL } } } });
  await prisma.user.deleteMany({ where: { universityId: { in: ALL } } });
  await prisma.room.deleteMany({ where: { roomNumber: ROOM } });
};

const get = (who: string, path: string) =>
  request(app).get(`/api/notifications${path}`).set('Authorization', `Bearer ${tokens[who]}`);
const patch = (who: string, path: string) =>
  request(app).patch(`/api/notifications${path}`).set('Authorization', `Bearer ${tokens[who]}`);

beforeAll(async () => {
  await cleanup();
  const room = await prisma.room.create({
    data: { roomNumber: ROOM, floor: 4, wing: 'A', roomType: 'DOUBLE', capacity: 2 },
  });
  users.provost = await create(IDS.provost, 'PROVOST');
  users.tutor = await create(IDS.tutor, 'HOUSE_TUTOR', { assignedFloor: 4 });
  users.otherTutor = await create(IDS.otherTutor, 'HOUSE_TUTOR', { assignedFloor: 9 });
  users.a = await create(IDS.a, 'STUDENT', { currentRoomId: room.id });
  users.b = await create(IDS.b, 'STUDENT');

  for (const key of Object.keys(IDS)) {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ universityId: IDS[key as keyof typeof IDS], password: PASSWORD });
    tokens[key] = res.body.data.accessToken;
  }

  // 25 for student A, spaced 1 ms apart so the order is known
  const base = Date.now() - 60_000;
  await prisma.notification.createMany({
    data: Array.from({ length: 25 }, (_, i) => ({
      userId: users.a,
      type: 'ACCOUNT_UPDATED',
      title: `n${i}`,
      message: 'm',
      createdAt: new Date(base + i),
    })),
  });
}, 60000);

afterAll(async () => {
  await cleanup();
  await prisma.$disconnect();
});

describe('Notifications', () => {
  it('pages newest first with a cursor, no overlaps or gaps', async () => {
    const first = await get('a', '?limit=10');
    expect(first.status).toBe(200);
    expect(first.body.data.items).toHaveLength(10);
    expect(first.body.data.items[0].title).toBe('n24');

    const seen = [...first.body.data.items];
    let cursor = first.body.data.nextCursor;
    while (cursor) {
      const page = await get('a', `?limit=10&cursor=${cursor}`);
      seen.push(...page.body.data.items);
      cursor = page.body.data.nextCursor;
    }
    expect(seen.map((n) => n.title)).toEqual(Array.from({ length: 25 }, (_, i) => `n${24 - i}`));
  });

  it('caps the page size', async () => {
    expect((await get('a', '?limit=500')).status).toBe(400);
  });

  it('counts unread and marks read only her own', async () => {
    expect((await get('a', '/unread-count')).body.data.count).toBe(25);
    const id = (await get('a', '?limit=1')).body.data.items[0].id;

    expect((await patch('b', `/${id}/read`)).status).toBe(404); // not hers
    expect((await patch('a', `/${id}/read`)).status).toBe(200);
    expect((await patch('a', `/${id}/read`)).status).toBe(404); // already read
    expect((await get('a', '/unread-count')).body.data.count).toBe(24);

    expect((await patch('a', '/read-all')).body.data.updated).toBe(24);
    expect((await get('a', '/unread-count')).body.data.count).toBe(0);
  });

  it("never lists another user's notifications", async () => {
    const res = await get('b', '');
    expect(res.body.data.items).toHaveLength(0);
  });

  it('requires a login', async () => {
    expect((await request(app).get('/api/notifications/unread-count')).status).toBe(401);
  });

  it('a complaint reaches the provost and her floor tutor, not other floors', async () => {
    const res = await request(app)
      .post('/api/applications')
      .set('Authorization', `Bearer ${tokens.a}`)
      .send({
        type: 'COMPLAINT',
        data: {
          category: 'ELECTRICAL',
          priority: 'NORMAL',
          title: 'Fan not working',
          description: 'The ceiling fan in my room stopped working last night.',
        },
      });
    expect(res.status).toBe(201);

    const count = (who: string) =>
      prisma.notification.count({ where: { userId: users[who], type: 'APPLICATION_SUBMITTED' } });
    expect(await count('provost')).toBe(1);
    expect(await count('tutor')).toBe(1);
    expect(await count('otherTutor')).toBe(0);
  });
});
