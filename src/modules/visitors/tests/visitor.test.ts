import request from 'supertest';
import app from '@/app';
import prisma from '@/config/database.config';
import { hashPassword } from '@/shared/utils/crypto/password.util';
import { addDays, dhakaToday } from '@/shared/utils/dhaka-date.util';
import { UserRole } from '@prisma/client';

const IDS = {
  provost: '8300000001',
  tutor9: '8300000002',
  tutor2: '8300000003',
  guard: '8300000004',
  cook: '8300000005',
  sara: '8300000006',
  other: '8300000007',
};
const ALL = Object.values(IDS);
const PASSWORD = 'Secret@123';
const ROOM = 'VS-901';
const users: Record<string, string> = {};
const tokens: Record<string, string> = {};
const day = (offset: number) => addDays(dhakaToday(), offset).toISOString().slice(0, 10);

const create = async (universityId: string, role: UserRole, extras: Record<string, unknown> = {}) =>
  (
    await prisma.user.create({
      data: {
        universityId,
        name: `Visit ${universityId.slice(-1)}`,
        email: `${universityId}@visit.test`,
        phone: '01712345678',
        role,
        password: await hashPassword(PASSWORD),
        isFirstLogin: false,
        ...extras,
      },
    })
  ).id;

const as = (who: string) => ({ Authorization: `Bearer ${tokens[who]}` });
const requestVisit = (who: string, visitDate: string, name = 'Ayesha Rahman') =>
  request(app)
    .post('/api/visitors')
    .set(as(who))
    .send({
      name,
      phone: '01811111111',
      relation: 'Mother',
      purpose: 'Bringing winter clothes',
      visitDate,
    });
const decide = (who: string, id: string, approve = true) =>
  request(app).post(`/api/visitors/${id}/decision`).set(as(who)).send({ approve });
const gate = (who: string, id: string, action: 'check-in' | 'check-out') =>
  request(app).post(`/api/visitors/${id}/${action}`).set(as(who));

const cleanup = async () => {
  await prisma.visitor.deleteMany({ where: { student: { universityId: { in: ALL } } } });
  await prisma.roomOccupant.deleteMany({ where: { user: { universityId: { in: ALL } } } });
  await prisma.refreshToken.deleteMany({ where: { user: { universityId: { in: ALL } } } });
  await prisma.user.deleteMany({ where: { universityId: { in: ALL } } });
  await prisma.room.deleteMany({ where: { roomNumber: ROOM } });
};

beforeAll(async () => {
  await cleanup();
  users.provost = await create(IDS.provost, 'PROVOST');
  users.tutor9 = await create(IDS.tutor9, 'HOUSE_TUTOR', { assignedFloor: 9 });
  users.tutor2 = await create(IDS.tutor2, 'HOUSE_TUTOR', { assignedFloor: 2 });
  users.guard = await create(IDS.guard, 'GUARD');
  users.cook = await create(IDS.cook, 'DINING_STAFF');
  users.sara = await create(IDS.sara, 'STUDENT');
  users.other = await create(IDS.other, 'STUDENT');
  for (const key of Object.keys(IDS)) {
    tokens[key] = (
      await request(app)
        .post('/api/auth/login')
        .send({ universityId: IDS[key as keyof typeof IDS], password: PASSWORD })
    ).body.data.accessToken;
  }
  const room = await prisma.room.create({
    data: { roomNumber: ROOM, floor: 9, wing: 'A', roomType: 'DOUBLE', capacity: 2 },
  });
  await request(app)
    .post(`/api/rooms/${room.id}/assign`)
    .set(as('provost'))
    .send({ userId: users.sara, bedNumber: 1 });
}, 60000);

afterAll(async () => {
  await cleanup();
  await prisma.$disconnect();
});

describe('Requesting', () => {
  it('only today up to 14 days ahead', async () => {
    expect((await requestVisit('sara', day(-1))).status).toBe(400);
    expect((await requestVisit('sara', day(15))).status).toBe(400);
    expect((await requestVisit('sara', day(3))).status).toBe(201);
  });

  it('notifies her floor tutor, not another floor', async () => {
    const count = (who: string) =>
      prisma.notification.count({ where: { userId: users[who], title: 'New visitor request' } });
    expect(await count('tutor9')).toBe(1);
    expect(await count('tutor2')).toBe(0);
  });
});

describe('Deciding', () => {
  let visitId: string;

  beforeAll(async () => {
    visitId = (await requestVisit('sara', day(0), 'Today Visitor')).body.data.id;
  });

  it("only her floor's tutor or the provost may decide", async () => {
    expect((await decide('tutor2', visitId)).status).toBe(404);
    expect((await decide('cook', visitId)).status).toBe(403);
    expect((await decide('tutor9', visitId)).status).toBe(200);
    expect((await decide('provost', visitId)).status).toBe(400); // already decided
  });

  it("the other floor's tutor doesn't even see it as pending", async () => {
    const res = await request(app).get('/api/visitors/pending').set(as('tutor2'));
    expect(res.body.data.map((v: { id: string }) => v.id)).not.toContain(visitId);
  });

  it("the guard's list is today's approved visitors, with name and room only", async () => {
    const res = await request(app).get('/api/visitors/today').set(as('guard'));
    const visit = res.body.data.find((v: { id: string }) => v.id === visitId);
    expect(visit.student.currentRoom.roomNumber).toBe(ROOM);
    expect(visit.student).not.toHaveProperty('phone');
    expect((await request(app).get('/api/visitors/today').set(as('cook'))).status).toBe(403);
  });

  it('check in once, check out once, and she is told at the gate', async () => {
    expect((await gate('guard', visitId, 'check-out')).status).toBe(400); // not in yet
    expect((await gate('guard', visitId, 'check-in')).status).toBe(200);
    expect((await gate('guard', visitId, 'check-in')).status).toBe(400);
    expect((await gate('guard', visitId, 'check-out')).status).toBe(200);
    const told = await prisma.notification.count({
      where: { userId: users.sara, title: 'Your visitor has arrived' },
    });
    expect(told).toBe(1);
  });

  it("can't check in a visitor approved for another day", async () => {
    const future = (await requestVisit('sara', day(2), 'Future Visitor')).body.data.id;
    await decide('provost', future);
    expect((await gate('guard', future, 'check-in')).status).toBe(400);
  });
});

describe('Cancelling', () => {
  it('only her own request', async () => {
    const id = (await requestVisit('sara', day(5), 'Cancel Me')).body.data.id;
    expect((await request(app).post(`/api/visitors/${id}/cancel`).set(as('other'))).status).toBe(
      404,
    );
    expect((await request(app).post(`/api/visitors/${id}/cancel`).set(as('sara'))).status).toBe(
      200,
    );
  });
});
