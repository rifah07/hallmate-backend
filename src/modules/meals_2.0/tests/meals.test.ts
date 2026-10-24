import request from 'supertest';
import app from '@/app';
import prisma from '@/config/database.config';
import { hashPassword } from '@/shared/utils/crypto/password.util';
import { addDays, dhakaToday } from '@/shared/utils/dhaka-date.util';

const IDS = { student: '7710000001', dining: '7710000002' };
const PASSWORD = 'Secret@123';
const tokens: Record<string, string> = {};
const ymd = (d: Date) => d.toISOString().slice(0, 10);

const cleanup = async () => {
  await prisma.mealCancellation.deleteMany({
    where: { student: { universityId: { in: Object.values(IDS) } } },
  });
  await prisma.refreshToken.deleteMany({
    where: { user: { universityId: { in: Object.values(IDS) } } },
  });
  await prisma.user.deleteMany({ where: { universityId: { in: Object.values(IDS) } } });
};

beforeAll(async () => {
  await cleanup();
  const password = await hashPassword(PASSWORD);
  for (const [key, role] of [
    ['student', 'STUDENT'],
    ['dining', 'DINING_STAFF'],
  ] as const) {
    await prisma.user.create({
      data: {
        universityId: IDS[key],
        role,
        name: `Meal ${role}`,
        email: `${IDS[key]}@meal.test`,
        phone: '01712345678',
        password,
        isFirstLogin: false,
        accountStatus: 'ACTIVE',
      },
    });
    const res = await request(app)
      .post('/api/auth/login')
      .send({ universityId: IDS[key], password: PASSWORD });
    tokens[key] = res.body.data.accessToken;
  }
}, 60000);

afterAll(async () => {
  await cleanup();
  await prisma.$disconnect();
});

const as = (who: string) => ({ Authorization: `Bearer ${tokens[who]}` });

describe('meal cancellation', () => {
  // Two days ahead: every deadline (24h before the meal, Dhaka time) is still in the future
  const later = ymd(addDays(dhakaToday(), 2));

  it('cancels a future dinner and shows it in her status', async () => {
    const res = await request(app)
      .post('/api/meals/cancel')
      .set(as('student'))
      .send({ dates: [later], mealTypes: ['dinner'] });
    expect(res.status).toBe(200);
    expect(res.body.data.successful).toHaveLength(1);

    const status = await request(app)
      .get(`/api/meals/my-status?dateFrom=${later}&dateTo=${later}`)
      .set(as('student'));
    expect(status.status).toBe(200);
    expect(status.body.data[0].meals.dinner.cancelled).toBe(true);
    expect(status.body.data[0].meals.lunch.cancelled).toBe(false);
  });

  it('deadline is 24 hours before the meal in Dhaka time, whatever the server zone', async () => {
    const status = await request(app)
      .get(`/api/meals/my-status?dateFrom=${later}&dateTo=${later}`)
      .set(as('student'));
    // dinner at 20:00 Dhaka = 14:00 UTC; deadline a day earlier
    const expected = new Date(`${later}T14:00:00Z`).getTime() - 24 * 60 * 60 * 1000;
    expect(new Date(status.body.data[0].meals.dinner.cancellationDeadline).getTime()).toBe(
      expected,
    );
  });

  it('refuses a past day', async () => {
    const res = await request(app)
      .post('/api/meals/cancel')
      .set(as('student'))
      .send({ dates: [ymd(addDays(dhakaToday(), -1))], mealTypes: ['lunch'] });
    expect(res.body.data.failed).toHaveLength(1);
  });

  it('status needs a valid range of at most 31 days', async () => {
    expect((await request(app).get('/api/meals/my-status').set(as('student'))).status).toBe(400);
    expect(
      (
        await request(app)
          .get('/api/meals/my-status?dateFrom=2000-01-01&dateTo=2100-01-01')
          .set(as('student'))
      ).status,
    ).toBe(400);
  });

  it('planning report counts without dividing by zero', async () => {
    const res = await request(app).get(`/api/meals/planning/${later}`).set(as('dining'));
    expect(res.status).toBe(200);
    expect(Number.isFinite(res.body.data.dinner.cancellationRate)).toBe(true);
  });
});
