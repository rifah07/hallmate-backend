import request from 'supertest';
import app from '@/app';
import prisma from '@/config/database.config';
import { hashPassword } from '@/shared/utils/crypto/password.util';
import { UserRole } from '@prisma/client';

const IDS = {
  provost: '8100000001',
  tutor3: '8100000002',
  tutor5: '8100000003',
  student3: '8100000004',
  student5: '8100000005',
  cook: '8100000006',
};
const ALL = Object.values(IDS);
const PASSWORD = 'Secret@123';
const ROOMS = ['NT-301', 'NT-501'];
const users: Record<string, string> = {};
const tokens: Record<string, string> = {};

const create = async (universityId: string, role: UserRole, extras: Record<string, unknown> = {}) =>
  (
    await prisma.user.create({
      data: {
        universityId,
        name: `Notice ${role}`,
        email: `${universityId}@notice.test`,
        phone: '01712345678',
        role,
        password: await hashPassword(PASSWORD),
        isFirstLogin: false,
        ...extras,
      },
    })
  ).id;

const as = (who: string) => ({ Authorization: `Bearer ${tokens[who]}` });
const post = (who: string, body: Record<string, string>) =>
  request(app).post('/api/notices').set(as(who)).send(body);
const titles = async (who: string) =>
  (await request(app).get('/api/notices').set(as(who))).body.data.items.map(
    (n: { title: string }) => n.title,
  );

const cleanup = async () => {
  await prisma.notice.deleteMany({ where: { title: { startsWith: 'NT ' } } });
  await prisma.roomOccupant.deleteMany({ where: { user: { universityId: { in: ALL } } } });
  await prisma.refreshToken.deleteMany({ where: { user: { universityId: { in: ALL } } } });
  await prisma.user.deleteMany({ where: { universityId: { in: ALL } } });
  await prisma.room.deleteMany({ where: { roomNumber: { in: ROOMS } } });
};

beforeAll(async () => {
  await cleanup();

  users.provost = await create(IDS.provost, 'PROVOST');
  users.tutor3 = await create(IDS.tutor3, 'HOUSE_TUTOR', { assignedFloor: 3 });
  users.tutor5 = await create(IDS.tutor5, 'HOUSE_TUTOR', { assignedFloor: 5 });
  users.student3 = await create(IDS.student3, 'STUDENT');
  users.student5 = await create(IDS.student5, 'STUDENT');
  users.cook = await create(IDS.cook, 'DINING_STAFF');
  for (const key of Object.keys(IDS)) {
    tokens[key] = (
      await request(app)
        .post('/api/auth/login')
        .send({ universityId: IDS[key as keyof typeof IDS], password: PASSWORD })
    ).body.data.accessToken;
  }
  for (const [roomNumber, floor, who] of [
    ['NT-301', 3, 'student3'],
    ['NT-501', 5, 'student5'],
  ] as const) {
    const room = await prisma.room.create({
      data: { roomNumber, floor, wing: 'A', roomType: 'DOUBLE', capacity: 2 },
    });
    await request(app)
      .post(`/api/rooms/${room.id}/assign`)
      .set(as('provost'))
      .send({ userId: users[who], bedNumber: 1 });
  }
}, 60000);

afterAll(async () => {
  await cleanup();
  await prisma.$disconnect();
});

describe('Posting', () => {
  it('provost posts hall-wide; everyone in the hall is notified', async () => {
    const res = await post('provost', { title: 'NT hall', content: 'Water off on Friday 10-12.' });
    expect(res.status).toBe(201);
    const count = await prisma.notification.count({
      where: {
        relatedEntityId: res.body.data.id,
        userId: { in: [users.student3, users.student5] },
      },
    });
    expect(count).toBe(2);
  });

  it('a house tutor posts to her floor only', async () => {
    expect(
      (
        await post('tutor3', {
          title: 'NT f3',
          content: 'Floor meeting',
          audience: 'FLOOR',
          targetFloor: '3',
        })
      ).status,
    ).toBe(201);
    expect(
      (await post('tutor3', { title: 'NT f5', content: 'x', audience: 'FLOOR', targetFloor: '5' }))
        .status,
    ).toBe(403);
    expect((await post('tutor3', { title: 'NT all', content: 'x' })).status).toBe(403);
  });

  it('students and support staff cannot post', async () => {
    expect((await post('student3', { title: 'NT s', content: 'x' })).status).toBe(403);
    expect((await post('cook', { title: 'NT c', content: 'x' })).status).toBe(403);
  });

  it('a floor notice needs a floor', async () => {
    expect(
      (await post('provost', { title: 'NT nofloor', content: 'x', audience: 'FLOOR' })).status,
    ).toBe(400);
  });

  it('rejects a file that only claims to be a PDF', async () => {
    const res = await request(app)
      .post('/api/notices')
      .set(as('provost'))
      .field('title', 'NT fake pdf')
      .field('content', 'Attached')
      .attach('pdf', Buffer.from('<html>not a pdf</html>'), {
        filename: 'notice.pdf',
        contentType: 'application/pdf',
      });
    expect(res.status).toBe(400);
  });
});

describe('Reading', () => {
  it('each floor sees hall-wide notices plus its own', async () => {
    expect(await titles('student3')).toEqual(expect.arrayContaining(['NT hall', 'NT f3']));
    expect(await titles('student5')).toContain('NT hall');
    expect(await titles('student5')).not.toContain('NT f3');
    expect(await titles('tutor5')).not.toContain('NT f3');
    expect(await titles('cook')).not.toContain('NT f3');
    expect(await titles('provost')).toEqual(expect.arrayContaining(['NT hall', 'NT f3']));
  });

  it('a hidden floor notice is a 404, not a 403', async () => {
    const notice = await prisma.notice.findFirstOrThrow({ where: { title: 'NT f3' } });
    expect((await request(app).get(`/api/notices/${notice.id}`).set(as('student5'))).status).toBe(
      404,
    );
    expect((await request(app).get(`/api/notices/${notice.id}`).set(as('student3'))).status).toBe(
      200,
    );
  });

  it('expired and withdrawn notices disappear', async () => {
    await post('provost', { title: 'NT expired', content: 'x', expiresAt: '2020-01-01' });
    expect(await titles('student3')).not.toContain('NT expired');

    const notice = await prisma.notice.findFirstOrThrow({ where: { title: 'NT f3' } });
    expect((await request(app).delete(`/api/notices/${notice.id}`).set(as('tutor5'))).status).toBe(
      404,
    );
    expect((await request(app).delete(`/api/notices/${notice.id}`).set(as('tutor3'))).status).toBe(
      200,
    );
    expect(await titles('student3')).not.toContain('NT f3');
  });
});
