import request from 'supertest';
import app from '@/app';
import prisma from '@/config/database.config';
import { hashPassword } from '@/shared/utils/crypto/password.util';
import { UserRole } from '@prisma/client';

// Approving an application must change the real world (rooms, status),
// and a swap needs the other student's own consent.

const IDS = {
  provost: '8000000001',
  tutor: '8000000002',
  newcomer: '8000000003',
  mover: '8000000004',
  leaver: '8000000005',
  swapA: '8000000006',
  swapB: '8000000007',
};
const ALL = Object.values(IDS);
const PASSWORD = 'Secret@123';
const ROOMS = ['AP-701', 'AP-702', 'AP-703'];
const users: Record<string, string> = {};
const tokens: Record<string, string> = {};
const rooms: Record<string, string> = {};

const create = async (universityId: string, role: UserRole, extras: Record<string, unknown> = {}) =>
  (
    await prisma.user.create({
      data: {
        universityId,
        name: `Appr ${universityId.slice(-1)}`,
        email: `${universityId}@appr.test`,
        phone: '01712345678',
        role,
        password: await hashPassword(PASSWORD),
        isFirstLogin: false,
        ...extras,
      },
    })
  ).id;

const as = (who: string) => ({ Authorization: `Bearer ${tokens[who]}` });
const assign = (roomId: string, userId: string, bedNumber: number) =>
  request(app).post(`/api/rooms/${roomId}/assign`).set(as('provost')).send({ userId, bedNumber });
const apply = (who: string, type: string, data: object) =>
  request(app).post('/api/applications').set(as(who)).send({ type, data });
const respond = (id: string, body: object) =>
  request(app)
    .post(`/api/applications/${id}/respond`)
    .set(as('provost'))
    .send({ responseNote: 'Reviewed by the hall office', ...body });
const occupantOf = (userId: string) => prisma.roomOccupant.findUnique({ where: { userId } });

const cleanup = async () => {
  await prisma.application.deleteMany({ where: { student: { universityId: { in: ALL } } } });
  await prisma.roomOccupant.deleteMany({ where: { user: { universityId: { in: ALL } } } });
  await prisma.refreshToken.deleteMany({ where: { user: { universityId: { in: ALL } } } });
  await prisma.user.deleteMany({ where: { universityId: { in: ALL } } });
  await prisma.room.deleteMany({ where: { roomNumber: { in: ROOMS } } });
};

beforeAll(async () => {
  await cleanup();
  for (const roomNumber of ROOMS) {
    rooms[roomNumber] = (
      await prisma.room.create({
        data: { roomNumber, floor: 7, wing: 'A', roomType: 'FOUR_SHARING', capacity: 4 },
      })
    ).id;
  }
  users.provost = await create(IDS.provost, 'PROVOST');
  users.tutor = await create(IDS.tutor, 'HOUSE_TUTOR', { assignedFloor: 7 });
  for (const key of ['newcomer', 'mover', 'leaver', 'swapA', 'swapB']) {
    users[key] = await create(IDS[key as keyof typeof IDS], 'STUDENT');
  }
  for (const key of Object.keys(IDS)) {
    tokens[key] = (
      await request(app)
        .post('/api/auth/login')
        .send({ universityId: IDS[key as keyof typeof IDS], password: PASSWORD })
    ).body.data.accessToken;
  }
  // Real assignments through the API, so currentRoomId is set the real way
  expect((await assign(rooms['AP-701'], users.mover, 1)).status).toBe(200);
  expect((await assign(rooms['AP-701'], users.leaver, 2)).status).toBe(200);
  expect((await assign(rooms['AP-701'], users.swapA, 3)).status).toBe(200);
  expect((await assign(rooms['AP-702'], users.swapB, 1)).status).toBe(200);
}, 60000);

afterAll(async () => {
  await cleanup();
  await prisma.$disconnect();
});

describe('Room assignment keeps currentRoomId in sync', () => {
  it('so the floor tutor can manage her floor', async () => {
    const user = await prisma.user.findUniqueOrThrow({ where: { id: users.mover } });
    expect(user.currentRoomId).toBe(rooms['AP-701']);
    const res = await request(app)
      .patch(`/api/users/${users.mover}`)
      .set(as('tutor'))
      .send({ phone: '01811111111' });
    expect(res.status).toBe(200);
  });
});

describe('Approving', () => {
  it('a seat application needs a bed, then assigns it', async () => {
    const appId = (
      await apply('newcomer', 'SEAT_APPLICATION', { reason: 'I live far from campus' })
    ).body.data.id;
    expect((await respond(appId, { status: 'APPROVED' })).status).toBe(400);

    const ok = await respond(appId, {
      status: 'APPROVED',
      allocation: { roomId: rooms['AP-703'], bedNumber: 1 },
    });
    expect(ok.status).toBe(200);
    expect((await occupantOf(users.newcomer))?.roomId).toBe(rooms['AP-703']);
  });

  it('a transfer moves her in one step', async () => {
    const res = await apply('mover', 'SEAT_TRANSFER', {
      currentRoomId: rooms['AP-701'],
      reason: 'Closer to the study room please',
    });
    expect(res.status).toBe(201);
    const ok = await respond(res.body.data.id, {
      status: 'APPROVED',
      allocation: { roomId: rooms['AP-703'], bedNumber: 2 },
    });
    expect(ok.status).toBe(200);
    expect((await occupantOf(users.mover))?.roomId).toBe(rooms['AP-703']);
    const user = await prisma.user.findUniqueOrThrow({ where: { id: users.mover } });
    expect(user.currentRoomId).toBe(rooms['AP-703']);
  });

  it('a transfer to a taken bed changes nothing', async () => {
    const res = await apply('mover', 'SEAT_TRANSFER', {
      currentRoomId: rooms['AP-703'],
      reason: 'Back to my old room please',
    });
    const bad = await respond(res.body.data.id, {
      status: 'APPROVED',
      allocation: { roomId: rooms['AP-701'], bedNumber: 2 }, // the leaver's bed
    });
    expect(bad.status).toBe(409);
    expect((await occupantOf(users.mover))?.roomId).toBe(rooms['AP-703']);
    const appRow = await prisma.application.findUniqueOrThrow({ where: { id: res.body.data.id } });
    expect(appRow.status).toBe('PENDING');
  });

  it('a cancellation frees the bed and cancels the seat with her reason', async () => {
    const res = await apply('leaver', 'SEAT_CANCELLATION', {
      reason: 'Moving home after graduation',
      effectiveDate: '2026-12-01',
    });
    expect((await respond(res.body.data.id, { status: 'APPROVED' })).status).toBe(200);
    expect(await occupantOf(users.leaver)).toBeNull();
    const user = await prisma.user.findUniqueOrThrow({ where: { id: users.leaver } });
    expect(user.accountStatus).toBe('SEAT_CANCELLED');
    expect(user.cancellationReason).toContain('Moving home after graduation');
  });
});

describe('Seat swap consent', () => {
  let swapId: string;

  it('is requested without any consent flag', async () => {
    const res = await apply('swapA', 'SEAT_SWAP', {
      currentRoomId: rooms['AP-701'],
      targetStudentId: users.swapB,
      targetRoomId: rooms['AP-702'],
      reason: 'We are friends and want to swap',
    });
    expect(res.status).toBe(201);
    swapId = res.body.data.id;
  });

  it('cannot be approved before she agrees', async () => {
    expect((await respond(swapId, { status: 'APPROVED' })).status).toBe(400);
  });

  it('only the other student can agree', async () => {
    const post = (who: string) =>
      request(app).post(`/api/applications/${swapId}/consent`).set(as(who));
    expect((await post('swapA')).status).toBe(404); // the requester can't consent for her
    expect((await post('newcomer')).status).toBe(404);
    expect((await post('swapB')).status).toBe(200);
    expect((await post('swapB')).status).toBe(409); // once
  });

  it('then approval swaps the two beds', async () => {
    expect((await respond(swapId, { status: 'APPROVED' })).status).toBe(200);
    expect(await occupantOf(users.swapA)).toMatchObject({ roomId: rooms['AP-702'], bedNumber: 1 });
    expect(await occupantOf(users.swapB)).toMatchObject({ roomId: rooms['AP-701'], bedNumber: 3 });
  });
});

describe('Seat swap by university ID', () => {
  it('a student names her friend by university ID; the server finds the rooms', async () => {
    // After the swap above, swapA lives in AP-702
    const res = await apply('swapB', 'SEAT_SWAP', {
      targetUniversityId: IDS.swapA,
      reason: 'We would like our old beds back',
    });
    expect(res.status).toBe(201);
    expect(res.body.data.data).toMatchObject({
      targetStudentId: users.swapA,
      targetRoomId: rooms['AP-702'],
      currentRoomId: rooms['AP-701'],
    });
  });

  it('an unknown university ID is refused', async () => {
    const res = await apply('newcomer', 'SEAT_SWAP', {
      targetUniversityId: '8999999999',
      reason: 'Swap with someone who does not exist',
    });
    expect(res.status).toBe(404);
  });
});
