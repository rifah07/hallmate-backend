import request from 'supertest';
import app from '@/app';
import prisma from '@/config/database.config';
import { hashPassword } from '@/shared/utils/crypto/password.util';

const TEST_UNI_ID = '9999999999';

let currentPassword = 'NewPass@123';
let accessToken: string;
let refreshCookies: string[] = [];

// Helper to safely extract cookies
const extractCookies = (res: request.Response): string[] => {
  const cookies = res.headers['set-cookie'];
  if (!cookies) return [];
  return Array.isArray(cookies) ? cookies : [cookies];
};

describe('Auth Module', () => {
  beforeAll(async () => {
    const hashedOTP = await hashPassword('TestOTP123');

    await prisma.refreshToken.deleteMany({
      where: { user: { universityId: TEST_UNI_ID } },
    });
    await prisma.user.deleteMany({ where: { universityId: TEST_UNI_ID } });

    await prisma.user.create({
      data: {
        universityId: TEST_UNI_ID,
        name: 'Test User',
        email: 'test@test.com',
        phone: '01712345678',
        role: 'STUDENT',
        password: await hashPassword('dummy'),
        oneTimePassword: hashedOTP,
        isFirstLogin: true,
        accountStatus: 'ACTIVE',
        department: 'CSE',
        year: 1,
        program: 'UNDERGRADUATE',
        session: '2024-2025',
      },
    });
  }, 30000);

  afterAll(async () => {
    await prisma.refreshToken.deleteMany({
      where: { user: { universityId: TEST_UNI_ID } },
    });
    await prisma.user.deleteMany({ where: { universityId: TEST_UNI_ID } });
    await prisma.$disconnect();
  }, 10000);

  // ============================================================================
  // FIRST TIME LOGIN
  // ============================================================================

  describe('POST /api/auth/first-time-login', () => {
    it('should complete first-time login with valid OTP', async () => {
      const res = await request(app).post('/api/auth/first-time-login').send({
        universityId: TEST_UNI_ID,
        oneTimePassword: 'TestOTP123',
        newPassword: 'NewPass@123',
        confirmPassword: 'NewPass@123',
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data).toHaveProperty('user');
      expect(res.body.data.user).not.toHaveProperty('password');

      accessToken = res.body.data.accessToken;
      refreshCookies = extractCookies(res);
    }, 15000);

    it('should reject second first-time login attempt', async () => {
      const res = await request(app).post('/api/auth/first-time-login').send({
        universityId: TEST_UNI_ID,
        oneTimePassword: 'TestOTP123',
        newPassword: 'NewPass@123',
        confirmPassword: 'NewPass@123',
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    }, 15000);

    it('should reject non-existent user', async () => {
      const res = await request(app).post('/api/auth/first-time-login').send({
        universityId: '1234567890',
        oneTimePassword: 'WrongOTP1',
        newPassword: 'NewPass@123',
        confirmPassword: 'NewPass@123',
      });

      expect(res.status).toBe(404);
    }, 15000);

    it('should reject mismatched passwords', async () => {
      const res = await request(app).post('/api/auth/first-time-login').send({
        universityId: TEST_UNI_ID,
        oneTimePassword: 'TestOTP123',
        newPassword: 'NewPass@123',
        confirmPassword: 'DifferentPass@123',
      });

      expect(res.status).toBe(400);
    }, 15000);

    it('should reject weak password', async () => {
      const res = await request(app).post('/api/auth/first-time-login').send({
        universityId: TEST_UNI_ID,
        oneTimePassword: 'TestOTP123',
        newPassword: 'weakpassword',
        confirmPassword: 'weakpassword',
      });

      expect(res.status).toBe(400);
    }, 15000);
  });

  // ============================================================================
  // LOGIN
  // ============================================================================

  describe('POST /api/auth/login', () => {
    it('should login with correct password', async () => {
      const res = await request(app).post('/api/auth/login').send({
        universityId: TEST_UNI_ID,
        password: currentPassword,
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data.user.universityId).toBe(TEST_UNI_ID);
      expect(res.body.data.user).not.toHaveProperty('password');

      accessToken = res.body.data.accessToken;
      refreshCookies = extractCookies(res);
    }, 15000);

    it('should reject wrong password', async () => {
      const res = await request(app).post('/api/auth/login').send({
        universityId: TEST_UNI_ID,
        password: 'WrongPass@999',
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    }, 15000);

    it('should reject non-existent university ID', async () => {
      const res = await request(app).post('/api/auth/login').send({
        universityId: '0000000000',
        password: 'SomePass@123',
      });

      expect(res.status).toBe(401);
    }, 15000);

    it('should reject invalid university ID format', async () => {
      const res = await request(app).post('/api/auth/login').send({
        universityId: 'ABCD',
        password: 'SomePass@123',
      });

      expect(res.status).toBe(400);
    }, 15000);

    it('should reject missing fields', async () => {
      const res = await request(app).post('/api/auth/login').send({ universityId: TEST_UNI_ID });

      expect(res.status).toBe(400);
    }, 15000);
  });

  // ============================================================================
  // REFRESH TOKEN
  // ============================================================================

  describe('POST /api/auth/refresh-token', () => {
    it('should return new access token with valid refresh token cookie', async () => {
      if (!refreshCookies.length) {
        throw new Error('refreshCookies not set — login test must pass first');
      }

      const res = await request(app).post('/api/auth/refresh-token').set('Cookie', refreshCookies);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('accessToken');

      accessToken = res.body.data.accessToken;
      refreshCookies = extractCookies(res);
    }, 15000);

    it('should reject request with no cookie', async () => {
      const res = await request(app).post('/api/auth/refresh-token');

      expect(res.status).toBe(401);
    }, 15000);

    it('should reject reused refresh token', async () => {
      if (!refreshCookies.length) throw new Error('refreshCookies not set');

      // Use token once — get new cookies
      const firstUse = await request(app)
        .post('/api/auth/refresh-token')
        .set('Cookie', refreshCookies);

      expect(firstUse.status).toBe(200);

      // Save old cookies before overwriting
      const oldCookies = refreshCookies;

      // Update for subsequent tests
      accessToken = firstUse.body.data.accessToken;
      refreshCookies = extractCookies(firstUse);

      // Try to reuse the old token — should be rejected
      const reuseAttempt = await request(app)
        .post('/api/auth/refresh-token')
        .set('Cookie', oldCookies);

      expect(reuseAttempt.status).toBe(401);

      // Token reuse detection revokes ALL tokens — need to login again
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ universityId: TEST_UNI_ID, password: currentPassword });

      accessToken = loginRes.body.data.accessToken;
      refreshCookies = extractCookies(loginRes);
    }, 15000);
  });

  // ============================================================================
  // PROFILE
  // ============================================================================

  describe('GET /api/auth/profile', () => {
    it('should get profile with valid token', async () => {
      if (!accessToken) throw new Error('accessToken not set — login test must pass first');

      const res = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.universityId).toBe(TEST_UNI_ID);
      expect(res.body.data).not.toHaveProperty('password');
    }, 15000);

    it('should reject request without token', async () => {
      const res = await request(app).get('/api/auth/profile');

      expect(res.status).toBe(401);
    }, 15000);

    it('should reject request with invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalidtoken123');

      expect(res.status).toBe(401);
    }, 15000);
  });

  // ============================================================================
  // FORGOT PASSWORD
  // ============================================================================

  describe('POST /api/auth/forgot-password', () => {
    it('should return success for existing user without revealing existence', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ universityId: TEST_UNI_ID });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    }, 15000);

    it('should return same success message for non-existent user', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ universityId: '0000000000' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    }, 15000);

    it('should reject invalid university ID format', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ universityId: 'INVALID' });

      expect(res.status).toBe(400);
    }, 15000);
  });

  // ============================================================================
  // CHANGE PASSWORD
  // ============================================================================

  describe('POST /api/auth/change-password', () => {
    it('should change password successfully', async () => {
      if (!accessToken) throw new Error('accessToken not set — login test must pass first');

      const res = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          oldPassword: currentPassword,
          newPassword: 'Updated@456',
          confirmPassword: 'Updated@456',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      currentPassword = 'Updated@456';
    }, 15000);

    it('should reject wrong old password', async () => {
      // Re-login since all tokens revoked after password change
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ universityId: TEST_UNI_ID, password: currentPassword });

      accessToken = loginRes.body.data.accessToken;
      refreshCookies = extractCookies(loginRes);

      const res = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          oldPassword: 'WrongOld@123',
          newPassword: 'NewNew@789',
          confirmPassword: 'NewNew@789',
        });

      expect(res.status).toBe(400);
    }, 15000);

    it('should reject same password as current', async () => {
      const res = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          oldPassword: currentPassword,
          newPassword: currentPassword,
          confirmPassword: currentPassword,
        });

      expect(res.status).toBe(400);
    }, 15000);

    it('should reject mismatched confirm password', async () => {
      const res = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          oldPassword: currentPassword,
          newPassword: 'NewNew@789',
          confirmPassword: 'Different@789',
        });

      expect(res.status).toBe(400);
    }, 15000);

    it('should reject without authentication', async () => {
      const res = await request(app).post('/api/auth/change-password').send({
        oldPassword: currentPassword,
        newPassword: 'NewNew@789',
        confirmPassword: 'NewNew@789',
      });

      expect(res.status).toBe(401);
    }, 15000);
  });

  // ============================================================================
  // LOGOUT
  // ============================================================================

  describe('POST /api/auth/logout', () => {
    it('should logout successfully', async () => {
      if (!refreshCookies.length) throw new Error('refreshCookies not set');

      const res = await request(app)
        .post('/api/auth/logout')
        .set('Cookie', refreshCookies)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    }, 15000);

    it('should reject refresh token after logout', async () => {
      const res = await request(app).post('/api/auth/refresh-token').set('Cookie', refreshCookies);

      expect(res.status).toBe(401);
    }, 15000);

    it('should still accept access token after logout (expected — JWT is stateless)', async () => {
      const res = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`);

      // Access token valid until expiry — only refresh token is revoked on logout
      expect(res.status).toBe(200);
    }, 15000);
  });
});
