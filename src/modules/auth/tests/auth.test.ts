import request from 'supertest';
import app from '@/app';
import prisma from '@/config/database.config';
import { hashPassword } from '@/shared/utils/crypto/password.util';

const TEST_UNI_ID = '9999999999';

describe('Auth Module', () => {
  let accessToken: string;

  beforeAll(async () => {
    const hashedPassword = await hashPassword('TestOTP123');

    // Cleanup first in case previous test run left data
    await prisma.user.deleteMany({ where: { universityId: TEST_UNI_ID } });

    await prisma.user.create({
      data: {
        universityId: TEST_UNI_ID,
        name: 'Test User',
        email: 'test@test.com',
        phone: '01712345678',
        role: 'STUDENT',
        password: hashedPassword,
        oneTimePassword: hashedPassword,
        isFirstLogin: true,
        accountStatus: 'ACTIVE',
        department: 'CSE',
        year: 1,
        program: 'UNDERGRADUATE',
        session: '2024-2025',
      },
    });
  }, 30000); // 30s timeout for bcrypt + DB

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { universityId: TEST_UNI_ID } });
    await prisma.$disconnect();
  }, 10000);

  describe('POST /api/auth/first-time-login', () => {
    it('should complete first-time login', async () => {
      const res = await request(app).post('/api/auth/first-time-login').send({
        universityId: TEST_UNI_ID,
        oneTimePassword: 'TestOTP123',
        newPassword: 'NewPass@123',
        confirmPassword: 'NewPass@123',
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('accessToken');
      accessToken = res.body.data.accessToken;
    }, 15000);
  });

  describe('POST /api/auth/login', () => {
    it('should login with new password', async () => {
      const res = await request(app).post('/api/auth/login').send({
        universityId: TEST_UNI_ID,
        password: 'NewPass@123',
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.universityId).toBe(TEST_UNI_ID);
    }, 15000);

    it('should reject invalid password', async () => {
      const res = await request(app).post('/api/auth/login').send({
        universityId: TEST_UNI_ID,
        password: 'WrongPass',
      });

      expect(res.status).toBe(401);
    }, 15000);
  });

  describe('GET /api/auth/profile', () => {
    it('should get profile with valid token', async () => {
      const res = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.universityId).toBe(TEST_UNI_ID);
    }, 15000);

    it('should reject without token', async () => {
      const res = await request(app).get('/api/auth/profile');

      expect(res.status).toBe(401);
    }, 15000);
  });

  describe('POST /api/auth/change-password', () => {
    it('should change password', async () => {
      const res = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          oldPassword: 'NewPass@123',
          newPassword: 'Updated@456',
          confirmPassword: 'Updated@456',
        });

      expect(res.status).toBe(200);
    }, 15000);
  });
});
