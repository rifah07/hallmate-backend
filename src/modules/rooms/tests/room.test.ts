// src/modules/rooms/tests/room.test.ts

import request from 'supertest';
import app from '@/app';
import prisma from '@/config/database.config';
import { hashPassword } from '@/shared/utils/crypto/password.util';
import { UserRole } from '@prisma/client';

// ============================================================================
// TEST SETUP
// ============================================================================

const ADMIN_UNI_ID = '8888888801';
const PROVOST_UNI_ID = '8888888802';
const TUTOR_FLOOR3_UNI_ID = '8888888803';
const TUTOR_FLOOR5_UNI_ID = '8888888804';
const STUDENT1_UNI_ID = '8888888805';
const STUDENT2_UNI_ID = '8888888806';
const STUDENT3_UNI_ID = '8888888807';

let adminToken: string;
let provostToken: string;
let tutorFloor3Token: string;
let studentToken: string;

let student1Id: string;
let student2Id: string;
let student3Id: string;

let room301Id: string;
let room302Id: string;
let room501Id: string;

const loginAs = async (universityId: string, password: string): Promise<string> => {
  const res = await request(app).post('/api/auth/login').send({ universityId, password });
  return res.body.data.accessToken;
};

// ============================================================================
// FIXTURES
// ============================================================================

const createTestUser = async (
  universityId: string,
  role: string,
  password: string,
  extras: Record<string, unknown> = {},
) => {
  return await prisma.user.create({
    data: {
      universityId,
      name: `Test ${role}`,
      email: `${universityId}@test.com`,
      phone: '01712345678',
      role: role as UserRole,
      password: await hashPassword(password),
      isFirstLogin: false,
      accountStatus: 'ACTIVE',
      ...extras,
    },
  });
};

// ============================================================================
// LIFECYCLE
// ============================================================================

beforeAll(async () => {
  // Clean up rooms first
  await prisma.roomOccupant.deleteMany({
    where: {
      room: {
        roomNumber: { in: ['TEST-301', 'TEST-302', 'TEST-303', 'TEST-501'] },
      },
    },
  });

  await prisma.room.deleteMany({
    where: {
      roomNumber: { in: ['TEST-301', 'TEST-302', 'TEST-303', 'TEST-501'] },
    },
  });

  // Clean up users
  await prisma.refreshToken.deleteMany({
    where: {
      user: {
        universityId: {
          in: [
            ADMIN_UNI_ID,
            PROVOST_UNI_ID,
            TUTOR_FLOOR3_UNI_ID,
            TUTOR_FLOOR5_UNI_ID,
            STUDENT1_UNI_ID,
            STUDENT2_UNI_ID,
            STUDENT3_UNI_ID,
          ],
        },
      },
    },
  });

  await prisma.user.deleteMany({
    where: {
      universityId: {
        in: [
          ADMIN_UNI_ID,
          PROVOST_UNI_ID,
          TUTOR_FLOOR3_UNI_ID,
          TUTOR_FLOOR5_UNI_ID,
          STUDENT1_UNI_ID,
          STUDENT2_UNI_ID,
          STUDENT3_UNI_ID,
        ],
      },
    },
  });

  // Create test users
  await createTestUser(ADMIN_UNI_ID, 'SUPER_ADMIN', 'Admin@123');
  await createTestUser(PROVOST_UNI_ID, 'PROVOST', 'Provost@123');
  await createTestUser(TUTOR_FLOOR3_UNI_ID, 'HOUSE_TUTOR', 'Tutor@123', { assignedFloor: 3 });
  await createTestUser(TUTOR_FLOOR5_UNI_ID, 'HOUSE_TUTOR', 'Tutor@123', { assignedFloor: 5 });

  const student1 = await createTestUser(STUDENT1_UNI_ID, 'STUDENT', 'Student@123', {
    department: 'CSE',
    year: 2,
    program: 'UNDERGRADUATE',
    session: '2022-23',
  });
  student1Id = student1.id;

  const student2 = await createTestUser(STUDENT2_UNI_ID, 'STUDENT', 'Student@123', {
    department: 'CSE',
    year: 2,
    program: 'UNDERGRADUATE',
    session: '2022-23',
  });
  student2Id = student2.id;

  const student3 = await createTestUser(STUDENT3_UNI_ID, 'STUDENT', 'Student@123', {
    department: 'CSE',
    year: 2,
    program: 'UNDERGRADUATE',
    session: '2022-23',
  });
  student3Id = student3.id;

  // Login to get tokens
  adminToken = await loginAs(ADMIN_UNI_ID, 'Admin@123');
  provostToken = await loginAs(PROVOST_UNI_ID, 'Provost@123');
  tutorFloor3Token = await loginAs(TUTOR_FLOOR3_UNI_ID, 'Tutor@123');
  studentToken = await loginAs(STUDENT1_UNI_ID, 'Student@123');
}, 30000);

afterAll(async () => {
  // Clean up rooms
  await prisma.roomOccupant.deleteMany({
    where: {
      room: {
        roomNumber: { in: ['TEST-301', 'TEST-302', 'TEST-303', 'TEST-501'] },
      },
    },
  });

  await prisma.room.deleteMany({
    where: {
      roomNumber: { in: ['TEST-301', 'TEST-302', 'TEST-303', 'TEST-501'] },
    },
  });

  // Clean up users
  await prisma.refreshToken.deleteMany({
    where: {
      user: {
        universityId: {
          in: [
            ADMIN_UNI_ID,
            PROVOST_UNI_ID,
            TUTOR_FLOOR3_UNI_ID,
            TUTOR_FLOOR5_UNI_ID,
            STUDENT1_UNI_ID,
            STUDENT2_UNI_ID,
            STUDENT3_UNI_ID,
          ],
        },
      },
    },
  });

  await prisma.user.deleteMany({
    where: {
      universityId: {
        in: [
          ADMIN_UNI_ID,
          PROVOST_UNI_ID,
          TUTOR_FLOOR3_UNI_ID,
          TUTOR_FLOOR5_UNI_ID,
          STUDENT1_UNI_ID,
          STUDENT2_UNI_ID,
          STUDENT3_UNI_ID,
        ],
      },
    },
  });

  await prisma.$disconnect();
}, 10000);

// ============================================================================
// TESTS
// ============================================================================

describe('Rooms Module', () => {
  // --------------------------------------------------------------------------
  // CREATE ROOM
  // --------------------------------------------------------------------------

  describe('POST /api/rooms', () => {
    it('should create a room as Super Admin', async () => {
      const res = await request(app)
        .post('/api/rooms')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          roomNumber: 'TEST-301',
          floor: 3,
          wing: 'A',
          roomType: 'DOUBLE',
          capacity: 2,
          hasAC: true,
          hasBalcony: false,
          hasAttachedBath: true,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.roomNumber).toBe('TEST-301');
      expect(res.body.data.floor).toBe(3);
      expect(res.body.data.capacity).toBe(2);
      expect(res.body.data.vacantBeds).toEqual([1, 2]);
      expect(res.body.data.occupancyRate).toBe(0);

      room301Id = res.body.data.id;
    }, 15000);

    it('should create a room as Provost', async () => {
      const res = await request(app)
        .post('/api/rooms')
        .set('Authorization', `Bearer ${provostToken}`)
        .send({
          roomNumber: 'TEST-302',
          floor: 3,
          wing: 'A',
          roomType: 'TRIPLE',
          capacity: 3,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.capacity).toBe(3);
      room302Id = res.body.data.id;
    }, 15000);

    it('should create a room on floor 5', async () => {
      const res = await request(app)
        .post('/api/rooms')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          roomNumber: 'TEST-501',
          floor: 5,
          wing: 'B',
          roomType: 'DOUBLE',
          capacity: 2,
        });

      expect(res.status).toBe(201);
      room501Id = res.body.data.id;
    }, 15000);

    it('should reject duplicate room number', async () => {
      const res = await request(app)
        .post('/api/rooms')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          roomNumber: 'TEST-301',
          floor: 3,
          wing: 'A',
          roomType: 'SINGLE',
          capacity: 1,
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    }, 15000);

    it('should reject invalid capacity for room type', async () => {
      const res = await request(app)
        .post('/api/rooms')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          roomNumber: 'TEST-303',
          floor: 3,
          wing: 'A',
          roomType: 'DOUBLE',
          capacity: 3,
        });

      expect(res.status).toBe(400);
    }, 15000);

    it('should reject room creation by House Tutor', async () => {
      const res = await request(app)
        .post('/api/rooms')
        .set('Authorization', `Bearer ${tutorFloor3Token}`)
        .send({
          roomNumber: 'TEST-304',
          floor: 3,
          wing: 'A',
          roomType: 'SINGLE',
          capacity: 1,
        });

      expect(res.status).toBe(403);
    }, 15000);

    it('should reject room creation by Student', async () => {
      const res = await request(app)
        .post('/api/rooms')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          roomNumber: 'TEST-305',
          floor: 3,
          wing: 'A',
          roomType: 'SINGLE',
          capacity: 1,
        });

      expect(res.status).toBe(403);
    }, 15000);
  });

  // --------------------------------------------------------------------------
  // GET ROOMS
  // --------------------------------------------------------------------------

  describe('GET /api/rooms', () => {
    it('should get all rooms as Super Admin', async () => {
      const res = await request(app).get('/api/rooms').set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.rooms).toBeInstanceOf(Array);
      expect(res.body.data.pagination).toBeDefined();
    }, 15000);

    it('should filter rooms by floor', async () => {
      const res = await request(app)
        .get('/api/rooms?floor=3')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.rooms.every((r: any) => r.floor === 3)).toBe(true);
    }, 15000);

    it('should auto-filter to floor 3 for House Tutor', async () => {
      const res = await request(app)
        .get('/api/rooms')
        .set('Authorization', `Bearer ${tutorFloor3Token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.rooms.every((r: any) => r.floor === 3)).toBe(true);
    }, 15000);

    it('should reject student access', async () => {
      const res = await request(app).get('/api/rooms').set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(403);
    }, 15000);
  });

  // --------------------------------------------------------------------------
  // GET ROOM BY ID
  // --------------------------------------------------------------------------

  describe('GET /api/rooms/:roomId', () => {
    it('should get room details as Super Admin', async () => {
      const res = await request(app)
        .get(`/api/rooms/${room301Id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(room301Id);
      expect(res.body.data.roomNumber).toBe('TEST-301');
    }, 15000);

    it('should allow House Tutor to view room on their floor', async () => {
      const res = await request(app)
        .get(`/api/rooms/${room301Id}`)
        .set('Authorization', `Bearer ${tutorFloor3Token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(room301Id);
    }, 15000);

    it('should reject House Tutor viewing room on different floor', async () => {
      const res = await request(app)
        .get(`/api/rooms/${room501Id}`)
        .set('Authorization', `Bearer ${tutorFloor3Token}`);

      expect(res.status).toBe(403);
    }, 15000);

    it('should return 404 for non-existent room', async () => {
      const res = await request(app)
        .get('/api/rooms/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    }, 15000);
  });

  // --------------------------------------------------------------------------
  // GET VACANT ROOMS
  // --------------------------------------------------------------------------

  describe('GET /api/rooms/vacant', () => {
    it('should get all vacant rooms as Super Admin', async () => {
      const res = await request(app)
        .get('/api/rooms/vacant')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.rooms).toBeInstanceOf(Array);
      expect(res.body.data.count).toBeGreaterThan(0);
    }, 15000);

    it('should auto-filter vacant rooms for House Tutor', async () => {
      const res = await request(app)
        .get('/api/rooms/vacant')
        .set('Authorization', `Bearer ${tutorFloor3Token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.rooms.every((r: any) => r.floor === 3)).toBe(true);
    }, 15000);
  });

  describe('GET /api/rooms/my-floor', () => {
    it('should get house tutor floor rooms', async () => {
      const res = await request(app)
        .get('/api/rooms/my-floor')
        .set('Authorization', `Bearer ${tutorFloor3Token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.floor).toBe(3);
      expect(res.body.data.rooms.every((r: any) => r.floor === 3)).toBe(true);
    }, 15000);

    it('should reject non-house-tutor access', async () => {
      const res = await request(app)
        .get('/api/rooms/my-floor')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(403);
    }, 15000);
  });

  // --------------------------------------------------------------------------
  // ASSIGN STUDENT
  // --------------------------------------------------------------------------

  describe('POST /api/rooms/:roomId/assign', () => {
    it('should assign student to bed 1', async () => {
      const res = await request(app)
        .post(`/api/rooms/${room301Id}/assign`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          userId: student1Id,
          bedNumber: 1,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.occupants).toHaveLength(1);
      expect(res.body.data.occupants[0].bedNumber).toBe(1);
      expect(res.body.data.vacantBeds).toEqual([2]);
      expect(res.body.data.occupancyRate).toBe(50);
    }, 15000);

    it('should assign student to bed 2', async () => {
      const res = await request(app)
        .post(`/api/rooms/${room301Id}/assign`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          userId: student2Id,
          bedNumber: 2,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.occupants).toHaveLength(2);
      expect(res.body.data.vacantBeds).toEqual([]);
      expect(res.body.data.occupancyRate).toBe(100);
    }, 15000);

    it('should reject duplicate bed assignment', async () => {
      const res = await request(app)
        .post(`/api/rooms/${room301Id}/assign`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          userId: student3Id,
          bedNumber: 1,
        });

      expect(res.status).toBe(409);
    }, 15000);

    it('should reject student already in another room', async () => {
      const res = await request(app)
        .post(`/api/rooms/${room302Id}/assign`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          userId: student1Id,
          bedNumber: 1,
        });

      expect(res.status).toBe(409);
    }, 15000);

    it('should allow House Tutor to assign on their floor', async () => {
      const res = await request(app)
        .post(`/api/rooms/${room302Id}/assign`)
        .set('Authorization', `Bearer ${tutorFloor3Token}`)
        .send({
          userId: student3Id,
          bedNumber: 1,
        });

      expect(res.status).toBe(200);
    }, 15000);

    it('should reject House Tutor assigning on different floor', async () => {
      const res = await request(app)
        .post(`/api/rooms/${room501Id}/assign`)
        .set('Authorization', `Bearer ${tutorFloor3Token}`)
        .send({
          userId: student3Id,
          bedNumber: 1,
        });

      expect(res.status).toBe(403);
    }, 15000);
  });

  // --------------------------------------------------------------------------
  // UNASSIGN STUDENT
  // --------------------------------------------------------------------------

  describe('DELETE /api/rooms/:roomId/unassign/:userId', () => {
    it('should unassign student from room', async () => {
      const res = await request(app)
        .delete(`/api/rooms/${room301Id}/unassign/${student2Id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.occupants).toHaveLength(1);
      expect(res.body.data.vacantBeds).toContain(2);
    }, 15000);

    it('should return 404 if student not in room', async () => {
      const res = await request(app)
        .delete(`/api/rooms/${room301Id}/unassign/${student3Id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    }, 15000);
  });

  // --------------------------------------------------------------------------
  // TRANSFER STUDENT
  // --------------------------------------------------------------------------

  describe('POST /api/rooms/:roomId/transfer', () => {
    beforeAll(async () => {
      // Re-assign student2 for transfer test
      await request(app)
        .post(`/api/rooms/${room301Id}/assign`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          userId: student2Id,
          bedNumber: 2,
        });
    }, 15000);

    it('should transfer student to another room', async () => {
      const res = await request(app)
        .post(`/api/rooms/${room301Id}/transfer`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          userId: student1Id,
          targetRoomId: room302Id,
          targetBedNumber: 2,
          reason: 'Roommate request',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(room302Id);
      expect(res.body.data.occupants.some((o: any) => o.id === student1Id)).toBe(true);
    }, 15000);

    it('should reject transfer to occupied bed', async () => {
      const res = await request(app)
        .post(`/api/rooms/${room301Id}/transfer`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          userId: student2Id,
          targetRoomId: room302Id,
          targetBedNumber: 1,
          reason: 'Test',
        });

      expect(res.status).toBe(409);
    }, 15000);
  });

  // --------------------------------------------------------------------------
  // UPDATE ROOM
  // --------------------------------------------------------------------------

  describe('PATCH /api/rooms/:roomId', () => {
    it('should update room details', async () => {
      const res = await request(app)
        .patch(`/api/rooms/${room501Id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          hasAC: true,
          status: 'MAINTENANCE',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.hasAC).toBe(true);
      expect(res.body.data.status).toBe('MAINTENANCE');
    }, 15000);

    it('should reject update by House Tutor', async () => {
      const res = await request(app)
        .patch(`/api/rooms/${room301Id}`)
        .set('Authorization', `Bearer ${tutorFloor3Token}`)
        .send({
          hasAC: false,
        });

      expect(res.status).toBe(403);
    }, 15000);
  });

  // --------------------------------------------------------------------------
  // STATISTICS
  // --------------------------------------------------------------------------

  describe('GET /api/rooms/statistics', () => {
    it('should get statistics as Super Admin', async () => {
      const res = await request(app)
        .get('/api/rooms/statistics')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.totalRooms).toBeGreaterThan(0);
      expect(res.body.data.totalBeds).toBeGreaterThan(0);
      expect(res.body.data.byFloor).toBeInstanceOf(Array);
      expect(res.body.data.byType).toBeInstanceOf(Array);
    }, 15000);

    it('should get floor-specific statistics for House Tutor', async () => {
      const res = await request(app)
        .get('/api/rooms/statistics')
        .set('Authorization', `Bearer ${tutorFloor3Token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.byFloor.every((f: any) => f.floor === 3)).toBe(true);
    }, 15000);
  });

  // --------------------------------------------------------------------------
  // DELETE ROOM
  // --------------------------------------------------------------------------

  describe('DELETE /api/rooms/:roomId', () => {
    it('should reject deleting room with occupants', async () => {
      const res = await request(app)
        .delete(`/api/rooms/${room301Id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
    }, 15000);

    it('should delete empty room', async () => {
      // Change status back first
      await request(app)
        .patch(`/api/rooms/${room501Id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'AVAILABLE' });

      const res = await request(app)
        .delete(`/api/rooms/${room501Id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
    }, 15000);

    it('should reject deletion by House Tutor', async () => {
      const res = await request(app)
        .delete(`/api/rooms/${room302Id}`)
        .set('Authorization', `Bearer ${tutorFloor3Token}`);

      expect(res.status).toBe(403);
    }, 15000);
  });

  // --------------------------------------------------------------------------
  // AUTHORIZATION
  // --------------------------------------------------------------------------

  describe('Authorization', () => {
    it('should reject unauthenticated requests', async () => {
      const res = await request(app).get('/api/rooms');

      expect(res.status).toBe(401);
    }, 15000);
  });
});