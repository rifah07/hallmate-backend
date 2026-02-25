import request from 'supertest';
import app from '@/app';
import prisma from '@/config/database.config';
import { hashPassword } from '@/shared/utils/crypto/password.util';
import { UserRole } from '@prisma/client';

// ============================================================================
// TEST SETUP
// ============================================================================

const ADMIN_UNI_ID = '0000000001';
const PROVOST_UNI_ID = '0000000002';
const STUDENT_UNI_ID = '0000000003';
const TARGET_UNI_ID = '0000000004';

let adminToken: string;
let provostToken: string;
let studentToken: string;
let createdUserId: string;

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
  // Cleanup
  await prisma.refreshToken.deleteMany({
    where: {
      user: { universityId: { in: [ADMIN_UNI_ID, PROVOST_UNI_ID, STUDENT_UNI_ID, TARGET_UNI_ID] } },
    },
  });
  await prisma.user.deleteMany({
    where: { universityId: { in: [ADMIN_UNI_ID, PROVOST_UNI_ID, STUDENT_UNI_ID, TARGET_UNI_ID] } },
  });

  // Create test users
  await createTestUser(ADMIN_UNI_ID, 'SUPER_ADMIN', 'Admin@123');
  await createTestUser(PROVOST_UNI_ID, 'PROVOST', 'Provost@123');
  await createTestUser(STUDENT_UNI_ID, 'STUDENT', 'Student@123', {
    department: 'CSE',
    year: 2,
    program: 'UNDERGRADUATE',
    session: '2022-23',
  });

  // Login all
  adminToken = await loginAs(ADMIN_UNI_ID, 'Admin@123');
  provostToken = await loginAs(PROVOST_UNI_ID, 'Provost@123');
  studentToken = await loginAs(STUDENT_UNI_ID, 'Student@123');
}, 30000);

afterAll(async () => {
  await prisma.refreshToken.deleteMany({
    where: {
      user: { universityId: { in: [ADMIN_UNI_ID, PROVOST_UNI_ID, STUDENT_UNI_ID, TARGET_UNI_ID] } },
    },
  });
  await prisma.user.deleteMany({
    where: { universityId: { in: [ADMIN_UNI_ID, PROVOST_UNI_ID, STUDENT_UNI_ID, TARGET_UNI_ID] } },
  });
  await prisma.$disconnect();
}, 10000);

// ============================================================================
// TESTS
// ============================================================================

describe('User Module', () => {
  // --------------------------------------------------------------------------
  // CREATE USER
  // --------------------------------------------------------------------------

  describe('POST /api/users', () => {
    it('should create a new student (admin)', async () => {
      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          universityId: TARGET_UNI_ID,
          name: 'New Student',
          email: `${TARGET_UNI_ID}@test.com`,
          phone: '01712345678',
          role: 'STUDENT',
          department: 'EEE',
          year: 1,
          program: 'UNDERGRADUATE',
          session: '2023-24',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data).not.toHaveProperty('password');
      expect(res.body.data.universityId).toBe(TARGET_UNI_ID);

      createdUserId = res.body.data.id;
    }, 15000);

    it('should reject duplicate university ID', async () => {
      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          universityId: TARGET_UNI_ID,
          name: 'Duplicate',
          email: 'different@test.com',
          phone: '01712345678',
          role: 'STUDENT',
          department: 'CSE',
          year: 1,
          program: 'UNDERGRADUATE',
          session: '2023-24',
        });

      expect(res.status).toBe(409);
    }, 15000);

    it('should reject duplicate email', async () => {
      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          universityId: '9999999998',
          name: 'Duplicate Email',
          email: `${TARGET_UNI_ID}@test.com`,
          phone: '01712345678',
          role: 'STUDENT',
          department: 'CSE',
          year: 1,
          program: 'UNDERGRADUATE',
          session: '2023-24',
        });

      expect(res.status).toBe(409);
    }, 15000);

    it('should reject student without required fields', async () => {
      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          universityId: '9999999997',
          name: 'Incomplete Student',
          email: 'incomplete@test.com',
          phone: '01712345678',
          role: 'STUDENT',
          // missing department, year, program, session
        });

      expect(res.status).toBe(400);
    }, 15000);

    it('should reject creation by student', async () => {
      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          universityId: '9999999996',
          name: 'Unauthorized',
          email: 'unauth@test.com',
          phone: '01712345678',
          role: 'STUDENT',
          department: 'CSE',
          year: 1,
          program: 'UNDERGRADUATE',
          session: '2023-24',
        });

      expect(res.status).toBe(403);
    }, 15000);

    it('should reject unauthenticated request', async () => {
      const res = await request(app).post('/api/users').send({
        universityId: '9999999995',
        name: 'No Auth',
        email: 'noauth@test.com',
        phone: '01712345678',
        role: 'STUDENT',
        department: 'CSE',
        year: 1,
        program: 'UNDERGRADUATE',
        session: '2023-24',
      });

      expect(res.status).toBe(401);
    }, 15000);
  });

  // --------------------------------------------------------------------------
  // GET ALL USERS
  // --------------------------------------------------------------------------

  describe('GET /api/users', () => {
    it('should get all users (admin)', async () => {
      const res = await request(app).get('/api/users').set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.meta).toHaveProperty('total');
      expect(res.body.meta).toHaveProperty('page');
      expect(res.body.meta).toHaveProperty('totalPages');
    }, 15000);

    it('should filter by role', async () => {
      const res = await request(app)
        .get('/api/users?role=STUDENT')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      res.body.data.forEach((u: any) => {
        expect(u.role).toBe('STUDENT');
      });
    }, 15000);

    it('should search by name', async () => {
      const res = await request(app)
        .get('/api/users?search=New Student')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
    }, 15000);

    it('should paginate correctly', async () => {
      const res = await request(app)
        .get('/api/users?page=1&limit=2')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeLessThanOrEqual(2);
      expect(res.body.meta.limit).toBe(2);
    }, 15000);

    it('should reject access by student', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(403);
    }, 15000);
  });

  // --------------------------------------------------------------------------
  // GET USER BY ID
  // --------------------------------------------------------------------------

  describe('GET /api/users/:userId', () => {
    it('should get user by ID (admin)', async () => {
      if (!createdUserId) throw new Error('createdUserId not set');

      const res = await request(app)
        .get(`/api/users/${createdUserId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(createdUserId);
      expect(res.body.data).not.toHaveProperty('password');
    }, 15000);

    it('should return 404 for non-existent user', async () => {
      const res = await request(app)
        .get('/api/users/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    }, 15000);

    it('should reject invalid UUID format', async () => {
      const res = await request(app)
        .get('/api/users/not-a-uuid')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
    }, 15000);
  });

  // --------------------------------------------------------------------------
  // GET USER BY UNIVERSITY ID
  // --------------------------------------------------------------------------

  describe('GET /api/users/university/:universityId', () => {
    it('should get user by university ID (admin)', async () => {
      const res = await request(app)
        .get(`/api/users/university/${TARGET_UNI_ID}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.universityId).toBe(TARGET_UNI_ID);
    }, 15000);

    it('should return 404 for non-existent university ID', async () => {
      const res = await request(app)
        .get('/api/users/university/0000000099')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    }, 15000);
  });

  // --------------------------------------------------------------------------
  // UPDATE USER
  // --------------------------------------------------------------------------

  describe('PATCH /api/users/:userId', () => {
    it('should update user (admin)', async () => {
      if (!createdUserId) throw new Error('createdUserId not set');

      const res = await request(app)
        .patch(`/api/users/${createdUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Updated Name' });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Updated Name');
    }, 15000);

    it('should reject empty update body', async () => {
      if (!createdUserId) throw new Error('createdUserId not set');

      const res = await request(app)
        .patch(`/api/users/${createdUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect(res.status).toBe(400);
    }, 15000);

    it('should reject duplicate email on update', async () => {
      if (!createdUserId) throw new Error('createdUserId not set');

      const res = await request(app)
        .patch(`/api/users/${createdUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ email: `${STUDENT_UNI_ID}@test.com` });

      expect(res.status).toBe(409);
    }, 15000);
  });

  // --------------------------------------------------------------------------
  // UPDATE ROLE
  // --------------------------------------------------------------------------

  describe('PATCH /api/users/:userId/role', () => {
    it('should update user role (super admin)', async () => {
      if (!createdUserId) throw new Error('createdUserId not set');

      const res = await request(app)
        .patch(`/api/users/${createdUserId}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'OFFICE_STAFF' });

      expect(res.status).toBe(200);
      expect(res.body.data.role).toBe('OFFICE_STAFF');
    }, 15000);

    it('should reject role update by provost', async () => {
      if (!createdUserId) throw new Error('createdUserId not set');

      const res = await request(app)
        .patch(`/api/users/${createdUserId}/role`)
        .set('Authorization', `Bearer ${provostToken}`)
        .send({ role: 'STUDENT' });

      expect(res.status).toBe(403);
    }, 15000);
  });

  // --------------------------------------------------------------------------
  // UPDATE ACCOUNT STATUS
  // --------------------------------------------------------------------------

  describe('PATCH /api/users/:userId/status', () => {
    it('should suspend user (admin)', async () => {
      if (!createdUserId) throw new Error('createdUserId not set');

      const res = await request(app)
        .patch(`/api/users/${createdUserId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ accountStatus: 'SUSPENDED' });

      expect(res.status).toBe(200);
      expect(res.body.data.accountStatus).toBe('SUSPENDED');
    }, 15000);

    it('should restore to active (admin)', async () => {
      if (!createdUserId) throw new Error('createdUserId not set');

      const res = await request(app)
        .patch(`/api/users/${createdUserId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ accountStatus: 'ACTIVE' });

      expect(res.status).toBe(200);
      expect(res.body.data.accountStatus).toBe('ACTIVE');
    }, 15000);
  });

  // --------------------------------------------------------------------------
  // STATISTICS
  // --------------------------------------------------------------------------

  describe('GET /api/users/statistics', () => {
    it('should get statistics (admin)', async () => {
      const res = await request(app)
        .get('/api/users/statistics')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('totalUsers');
      expect(res.body.data).toHaveProperty('activeUsers');
      expect(res.body.data).toHaveProperty('byRole');
    }, 15000);

    it('should reject access by student', async () => {
      const res = await request(app)
        .get('/api/users/statistics')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(403);
    }, 15000);
  });

  // --------------------------------------------------------------------------
  // GET BY ROLE
  // --------------------------------------------------------------------------

  describe('GET /api/users/role/:role', () => {
    it('should get users by role (admin)', async () => {
      const res = await request(app)
        .get('/api/users/role/STUDENT')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeInstanceOf(Array);
    }, 15000);

    it('should reject invalid role', async () => {
      const res = await request(app)
        .get('/api/users/role/INVALID_ROLE')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
    }, 15000);
  });

  // --------------------------------------------------------------------------
  // BULK CREATE
  // --------------------------------------------------------------------------

  describe('POST /api/users/bulk', () => {
    it('should bulk create users (super admin)', async () => {
      const res = await request(app)
        .post('/api/users/bulk')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          users: [
            {
              universityId: '8888888881',
              name: 'Bulk User 1',
              email: 'bulk1@test.com',
              phone: '01712345678',
              role: 'STUDENT',
              department: 'CSE',
              year: 1,
              program: 'UNDERGRADUATE',
              session: '2023-24',
            },
            {
              universityId: '8888888882',
              name: 'Bulk User 2',
              email: 'bulk2@test.com',
              phone: '01712345679',
              role: 'STUDENT',
              department: 'EEE',
              year: 2,
              program: 'UNDERGRADUATE',
              session: '2022-23',
            },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.data.created).toBeGreaterThan(0);

      // Cleanup bulk users
      await prisma.user.deleteMany({
        where: { universityId: { in: ['8888888881', '8888888882'] } },
      });
    }, 15000);

    it('should reject bulk create by provost', async () => {
      const res = await request(app)
        .post('/api/users/bulk')
        .set('Authorization', `Bearer ${provostToken}`)
        .send({ users: [] });

      expect(res.status).toBe(403);
    }, 15000);
  });

  // --------------------------------------------------------------------------
  // DELETE AND RESTORE
  // --------------------------------------------------------------------------

  describe('DELETE /api/users/:userId and POST /api/users/:userId/restore', () => {
    it('should soft delete user (admin)', async () => {
      if (!createdUserId) throw new Error('createdUserId not set');

      const res = await request(app)
        .delete(`/api/users/${createdUserId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    }, 15000);

    it('should return 404 after deletion', async () => {
      if (!createdUserId) throw new Error('createdUserId not set');

      const res = await request(app)
        .get(`/api/users/${createdUserId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    }, 15000);

    it('should restore deleted user (super admin)', async () => {
      if (!createdUserId) throw new Error('createdUserId not set');

      const res = await request(app)
        .post(`/api/users/${createdUserId}/restore`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.accountStatus).toBe('ACTIVE');
    }, 15000);

    it('should reject delete by student', async () => {
      if (!createdUserId) throw new Error('createdUserId not set');

      const res = await request(app)
        .delete(`/api/users/${createdUserId}`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(403);
    }, 15000);
  });
});
