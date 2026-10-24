import request from 'supertest';
import app from '@/app';
import prisma from '@/config/database.config';
import { hashPassword } from '@/shared/utils/crypto/password.util';
import { UserRole } from '@prisma/client';
import emailService from '@/shared/utils/email/email.service';

// One test per audit finding (2026-10-23), so a regression fails loudly.

const IDS = {
  admin: '7700000001',
  provost: '7700000002',
  tutor: '7700000003',
  student: '7700000004',
  otherFloor: '7700000005',
  fresh: '7700000006',
  reset: '7700000007',
  locked: '7700000008',
  cleaner: '7700000009',
  noMail: '7700000010',
  bulkNew: '7700000011',
};
const ALL = Object.values(IDS);
const PASSWORD = 'Secret@123';
const ROOMS = ['S-501', 'S-601'];

const users: Record<string, string> = {};
const tokens: Record<string, string> = {};

const login = (universityId: string, password = PASSWORD, ip = '10.0.0.1') =>
  request(app).post('/api/auth/login').set('X-Forwarded-For', ip).send({ universityId, password });

const create = async (
  universityId: string,
  role: UserRole,
  extras: Record<string, unknown> = {},
) => {
  const user = await prisma.user.create({
    data: {
      universityId,
      name: `Sec ${role}`,
      email: `${universityId}@sec.test`,
      phone: '01712345678',
      role,
      password: await hashPassword(PASSWORD),
      isFirstLogin: false,
      accountStatus: 'ACTIVE',
      ...extras,
    },
  });
  return user.id;
};

const cleanup = async () => {
  await prisma.auditLog.deleteMany({ where: { action: 'REISSUE_OTP' } });
  await prisma.application.deleteMany({ where: { student: { universityId: { in: ALL } } } });
  await prisma.refreshToken.deleteMany({ where: { user: { universityId: { in: ALL } } } });
  await prisma.user.deleteMany({ where: { universityId: { in: ALL } } });
  await prisma.room.deleteMany({ where: { roomNumber: { in: ROOMS } } });
};

beforeAll(async () => {
  await cleanup();
  const room5 = await prisma.room.create({
    data: { roomNumber: ROOMS[0], floor: 5, wing: 'A', roomType: 'DOUBLE', capacity: 2 },
  });
  const room6 = await prisma.room.create({
    data: { roomNumber: ROOMS[1], floor: 6, wing: 'A', roomType: 'DOUBLE', capacity: 2 },
  });

  users.admin = await create(IDS.admin, 'SUPER_ADMIN');
  users.provost = await create(IDS.provost, 'PROVOST');
  users.tutor = await create(IDS.tutor, 'HOUSE_TUTOR', { assignedFloor: 5 });
  users.student = await create(IDS.student, 'STUDENT', { currentRoomId: room5.id });
  users.otherFloor = await create(IDS.otherFloor, 'STUDENT', { currentRoomId: room6.id });
  users.fresh = await create(IDS.fresh, 'STUDENT', {
    isFirstLogin: true,
    oneTimePassword: await hashPassword('Fresh0TP'),
    otpExpiresAt: new Date(Date.now() + 60 * 60 * 1000),
  });
  users.reset = await create(IDS.reset, 'STUDENT');
  users.locked = await create(IDS.locked, 'STUDENT');
  users.cleaner = await create(IDS.cleaner, 'OFFICE_STAFF');

  for (const key of ['admin', 'provost', 'tutor', 'student', 'cleaner']) {
    tokens[key] = (await login(IDS[key as keyof typeof IDS])).body.data.accessToken;
  }
}, 60000);

afterAll(async () => {
  await cleanup();
  await prisma.$disconnect();
});

const patchUser = (token: string, userId: string, body: object) =>
  request(app).patch(`/api/users/${userId}`).set('Authorization', `Bearer ${token}`).send(body);

describe('#1 who may edit which profile fields', () => {
  it('house tutor cannot change the super admin (account takeover via email)', async () => {
    const res = await patchUser(tokens.tutor, users.admin, { email: 'attacker@evil.test' });
    expect(res.status).toBe(403);
  });

  it('house tutor cannot edit a student on another floor', async () => {
    const res = await patchUser(tokens.tutor, users.otherFloor, { phone: '01811111111' });
    expect(res.status).toBe(403);
  });

  it('house tutor can edit a student on her floor, but not her email', async () => {
    expect((await patchUser(tokens.tutor, users.student, { phone: '01811111111' })).status).toBe(
      200,
    );
    expect((await patchUser(tokens.tutor, users.student, { email: 'x@sec.test' })).status).toBe(
      403,
    );
  });

  it('student cannot give herself a staff field', async () => {
    const res = await patchUser(tokens.student, users.student, { assignedFloor: 3 });
    expect(res.status).toBe(403);
  });

  it('student can update her own phone', async () => {
    expect((await patchUser(tokens.student, users.student, { phone: '01922222222' })).status).toBe(
      200,
    );
  });

  it('provost can change a student email, but not the super admin', async () => {
    expect(
      (await patchUser(tokens.provost, users.student, { email: `${IDS.student}@new.test` })).status,
    ).toBe(200);
    expect((await patchUser(tokens.provost, users.admin, { phone: '01733333333' })).status).toBe(
      403,
    );
  });
});

describe('#2 resident search', () => {
  it('is closed to students', async () => {
    const res = await request(app)
      .get('/api/users/search?q=Sec')
      .set('Authorization', `Bearer ${tokens.student}`);
    expect(res.status).toBe(403);
  });

  it('caps the page size for staff', async () => {
    const res = await request(app)
      .get('/api/users/search?q=Sec&limit=100000')
      .set('Authorization', `Bearer ${tokens.tutor}`);
    expect(res.status).toBe(400);
  });
});

describe('#3 one-time and reset codes cannot be brute-forced', () => {
  it('reset code dies after 5 wrong tries, even if the 6th is right', async () => {
    await prisma.user.update({
      where: { id: users.reset },
      data: {
        passwordResetToken: await hashPassword('123456'),
        passwordResetExpires: new Date(Date.now() + 15 * 60 * 1000),
      },
    });
    const attempt = (otp: string) =>
      request(app)
        .post('/api/auth/reset-password')
        .send({ universityId: IDS.reset, otp, newPassword: 'Newpass@123' });

    for (let i = 0; i < 5; i++) expect((await attempt('000000')).status).toBe(400);
    const res = await attempt('123456');
    expect(res.status).toBe(400);
    expect(res.body.error.message).toMatch(/too many/i);
  }, 30000);

  it('first-login code locks after 5 wrong tries', async () => {
    const attempt = (oneTimePassword: string) =>
      request(app).post('/api/auth/first-time-login').send({
        universityId: IDS.fresh,
        oneTimePassword,
        newPassword: 'Newpass@123',
        confirmPassword: 'Newpass@123',
      });
    for (let i = 0; i < 5; i++) expect((await attempt('wrong')).status).toBe(401);
    expect((await attempt('Fresh0TP')).status).toBe(403);
  }, 30000);

  it('admin re-issue resets the counter (provost allowed, tutor not)', async () => {
    const reissue = (token: string) =>
      request(app)
        .post(`/api/users/${users.fresh}/reissue-otp`)
        .set('Authorization', `Bearer ${token}`);
    expect((await reissue(tokens.tutor)).status).toBe(403);
    expect((await reissue(tokens.provost)).status).toBe(200);
    const user = await prisma.user.findUniqueOrThrow({ where: { id: users.fresh } });
    expect(user.otpAttempts).toBe(0);
    expect(
      await prisma.auditLog.count({ where: { action: 'REISSUE_OTP', entityId: users.fresh } }),
    ).toBe(1);
  });
});

describe('#1b accounts that were never activated', () => {
  it('cannot log in with the stored placeholder password', async () => {
    await prisma.user.update({
      where: { id: users.fresh },
      data: { password: await hashPassword('PLACEHOLDER') }, // what old accounts still hold
    });
    const res = await login(IDS.fresh, 'PLACEHOLDER');
    expect(res.status).toBe(403);
    expect(res.body.data?.accessToken).toBeUndefined();
  });
});

describe('#4 changing the password ends other sessions', () => {
  it('an old refresh cookie stops working', async () => {
    const first = await login(IDS.reset);
    const cookie = first.headers['set-cookie'];
    const res = await request(app)
      .post('/api/auth/change-password')
      .set('Authorization', `Bearer ${first.body.data.accessToken}`)
      .send({ oldPassword: PASSWORD, newPassword: 'Changed@123', confirmPassword: 'Changed@123' });
    expect(res.status).toBe(200);
    expect((await request(app).post('/api/auth/refresh-token').set('Cookie', cookie)).status).toBe(
      401,
    );
  });
});

describe('#6 lockout is temporary and quiet', () => {
  it('locks after 5 wrong passwords, unlocks when the time passes', async () => {
    for (let i = 0; i < 4; i++) expect((await login(IDS.locked, 'wrong')).status).toBe(401);
    expect((await login(IDS.locked, 'wrong')).status).toBe(403);
    expect((await login(IDS.locked)).status).toBe(403); // still locked, even with the right password

    await prisma.user.update({ where: { id: users.locked }, data: { lockedUntil: new Date(0) } });
    expect((await login(IDS.locked)).status).toBe(200);
  }, 30000);

  it('a wrong university ID and a wrong password look the same', async () => {
    const unknown = await login('7799999999', 'wrong');
    const wrong = await login(IDS.student, 'wrong');
    expect(unknown.status).toBe(401);
    expect(unknown.body.error.message).toBe(wrong.body.error.message);
  });
});

describe('#7 an admin lock ends existing sessions', () => {
  it('a LOCKED account cannot use its access token', async () => {
    const token = (await login(IDS.otherFloor)).body.data.accessToken;
    await prisma.user.update({
      where: { id: users.otherFloor },
      data: { accountStatus: 'LOCKED' },
    });
    const res = await request(app).get('/api/auth/profile').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });
});

describe('#8 students cannot rewrite meal logs', () => {
  it('PUT on her own log is refused', async () => {
    const res = await request(app)
      .put(`/api/meals/${users.student}/2026-01-01`)
      .set('Authorization', `Bearer ${tokens.student}`)
      .send({ lunch: false });
    expect(res.status).toBe(403);
  });
});

describe('#9 support staff see the job, not the resident', () => {
  it('an assigned task shows her name but no phone, email or room', async () => {
    await prisma.application.create({
      data: {
        type: 'MAINTENANCE',
        studentId: users.student,
        assignedTo: users.cleaner,
        assignedToRole: 'OFFICE_STAFF',
        data: {
          category: 'Plumbing',
          priority: 'NORMAL',
          location: 'S-501 bathroom',
          description: 'Tap leaks all night long, please fix',
        },
      },
    });
    const res = await request(app)
      .get('/api/applications/assigned')
      .set('Authorization', `Bearer ${tokens.cleaner}`);
    expect(res.status).toBe(200);
    const [task] = res.body.data.applications;
    expect(task.data.location).toBe('S-501 bathroom');
    expect(task.student).toEqual({ name: 'Sec STUDENT' });
  });
});

describe('#10 a house tutor sees only the students on her floor', () => {
  const get = (path: string) =>
    request(app).get(path).set('Authorization', `Bearer ${tokens.tutor}`);

  it("the user list holds only her floor's students", async () => {
    const res = await get('/api/users?limit=100');
    expect(res.status).toBe(200);
    const ids = res.body.data.map((u: { id: string }) => u.id);
    expect(ids).toContain(users.student);
    expect(ids).not.toContain(users.otherFloor);
    expect(ids).not.toContain(users.admin);
  });

  it('search is scoped the same way', async () => {
    const res = await get(`/api/users/search?q=${IDS.otherFloor}`);
    expect(res.body.data).toHaveLength(0);
  });

  it('a student on another floor, or staff, look like they do not exist', async () => {
    expect((await get(`/api/users/${users.otherFloor}`)).status).toBe(404);
    expect((await get(`/api/users/university/${IDS.admin}`)).status).toBe(404);
    expect((await get(`/api/users/${users.student}`)).status).toBe(200);
  });

  it('cannot list another floor or staff by role', async () => {
    expect((await get('/api/users/floor/6')).status).toBe(403);
    expect((await get('/api/users/role/GUARD')).status).toBe(403);
  });
});

describe('#11 a failed email never loses a code or reveals an account', () => {
  afterEach(() => jest.restoreAllMocks());

  it('creating a user hands the one-time password to the provost when email fails', async () => {
    jest
      .spyOn(emailService, 'sendWelcomeEmail')
      .mockRejectedValueOnce(new Error('domain not verified'));
    const res = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${tokens.provost}`)
      .send({
        universityId: IDS.noMail,
        role: 'OFFICE_STAFF',
        name: 'No Mail',
        email: 'nomail@sec.test',
        phone: '01712345678',
      });
    expect(res.status).toBe(201);
    expect(res.body.data.emailSent).toBe(false);
    expect(res.body.data.oneTimePassword).toMatch(/\S{6,}/);
  });

  it('a sent email keeps the code out of the response', async () => {
    jest.spyOn(emailService, 'sendWelcomeEmail').mockResolvedValueOnce(undefined);
    const user = await prisma.user.findUniqueOrThrow({ where: { universityId: IDS.noMail } });
    const res = await request(app)
      .post(`/api/users/${user.id}/reissue-otp`)
      .set('Authorization', `Bearer ${tokens.provost}`);
    expect(res.status).toBe(200);
    expect(res.body.data.emailSent).toBe(true);
    expect(res.body.data.oneTimePassword).toBeUndefined();
  });

  it('forgot password answers the same when the reset email fails', async () => {
    jest.spyOn(emailService, 'sendPasswordResetOTP').mockRejectedValueOnce(new Error('down'));
    const real = await request(app)
      .post('/api/auth/forgot-password')
      .send({ universityId: IDS.reset });
    const unknown = await request(app)
      .post('/api/auth/forgot-password')
      .send({ universityId: '7799999998' });
    expect(real.status).toBe(200);
    expect(real.body).toEqual(unknown.body);
  });
});

describe('#12 bulk upload never emails people who already exist', () => {
  afterEach(() => jest.restoreAllMocks());

  it('skips the existing resident and emails only the new one', async () => {
    const send = jest
      .spyOn(emailService, 'sendWelcomeEmail')
      .mockRejectedValue(new Error('no domain'));
    const res = await request(app)
      .post('/api/users/bulk')
      .set('Authorization', `Bearer ${tokens.provost}`)
      .send({
        users: [
          {
            universityId: IDS.student,
            role: 'STUDENT',
            name: 'Already Here',
            email: 'other@sec.test',
            phone: '01712345678',
          },
          {
            universityId: IDS.bulkNew,
            role: 'OFFICE_STAFF',
            name: 'Bulk New',
            email: 'bulknew@sec.test',
            phone: '01712345678',
          },
        ],
      });
    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({ created: 1, skipped: 1 });
    expect(send).toHaveBeenCalledTimes(1);
    expect(send.mock.calls[0][0]).toBe('bulknew@sec.test');
    // the email failed, so the office gets the code instead of losing it
    expect(res.body.data.undelivered).toEqual([
      expect.objectContaining({ universityId: IDS.bulkNew, oneTimePassword: expect.any(String) }),
    ]);
  });
});

describe('#5 rate limits follow the reader, not a spoofable header', () => {
  beforeAll(() => {
    process.env.TEST_RATE_LIMITS = '1';
  });
  afterAll(() => {
    delete process.env.TEST_RATE_LIMITS;
  });

  it('x-client-ip without the internal key does not reset the count', async () => {
    let last = 0;
    for (let i = 0; i < 11; i++) {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .set('X-Forwarded-For', '10.9.9.9')
        .set('x-client-ip', `192.0.2.${i}`) // attacker rotates this
        .send({ universityId: '7799999999' });
      last = res.status;
    }
    expect(last).toBe(429);
  }, 30000);
});
