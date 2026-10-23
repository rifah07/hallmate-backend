import request from 'supertest';
import app from '@/app';
import prisma from '@/config/database.config';
import { hashPassword } from '@/shared/utils/crypto/password.util';
import { UserRole } from '@prisma/client';

const IDS = { student: '8400000001', guard: '8400000002', provost: '8400000003' };
const ALL = Object.values(IDS);
const PASSWORD = 'Secret@123';
const users: Record<string, string> = {};
const tokens: Record<string, string> = {};
let cardToken: string;

const as = (who: string) => ({ Authorization: `Bearer ${tokens[who]}` });
const verify = (token: string, who = 'guard') =>
  request(app).post('/api/id-card/verify').set(as(who)).send({ token });

const cleanup = async () => {
  await prisma.refreshToken.deleteMany({ where: { user: { universityId: { in: ALL } } } });
  await prisma.user.deleteMany({ where: { universityId: { in: ALL } } });
};

beforeAll(async () => {
  await cleanup();
  for (const [key, role] of [
    ['student', 'STUDENT'],
    ['guard', 'GUARD'],
    ['provost', 'PROVOST'],
  ] as [string, UserRole][]) {
    users[key] = (
      await prisma.user.create({
        data: {
          universityId: IDS[key as keyof typeof IDS],
          name: `Card ${key}`,
          email: `${key}@card.test`,
          phone: '01712345678',
          role,
          password: await hashPassword(PASSWORD),
          isFirstLogin: false,
        },
      })
    ).id;
    tokens[key] = (
      await request(app)
        .post('/api/auth/login')
        .send({ universityId: IDS[key as keyof typeof IDS], password: PASSWORD })
    ).body.data.accessToken;
  }
  const card = await request(app).get('/api/id-card/me').set(as('student'));
  expect(card.status).toBe(200);
  expect(card.body.data.qrSvg).toContain('<svg');
  cardToken = card.body.data.token;
}, 30000);

afterAll(async () => {
  await cleanup();
  await prisma.$disconnect();
});

describe('ID card', () => {
  it('a genuine card verifies for the guard', async () => {
    const res = await verify(cardToken);
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ valid: true, name: 'Card student' });
  });

  it('a tampered card is rejected', async () => {
    expect((await verify(cardToken.slice(0, -2) + 'xx')).status).toBe(400);
  });

  it('a card token is not an API login, and a login token is not a card', async () => {
    const asLogin = await request(app)
      .get('/api/auth/profile')
      .set('Authorization', `Bearer ${cardToken}`);
    expect(asLogin.status).toBe(401);
    expect((await verify(tokens.student)).status).toBe(400);
  });

  it('students cannot scan cards (it reveals photo and room)', async () => {
    expect((await verify(cardToken, 'student')).status).toBe(403);
  });

  it('stops counting the moment her seat is cancelled', async () => {
    await prisma.user.update({
      where: { id: users.student },
      data: { accountStatus: 'SEAT_CANCELLED' },
    });
    const res = await verify(cardToken);
    expect(res.body.data).toMatchObject({ valid: false, status: 'SEAT_CANCELLED' });
  });
});
