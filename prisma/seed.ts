import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Hash OTP
  const otp = 'TestOTP1';
  const hashedOTP = await bcrypt.hash(otp, 10);

  // Create test student
  const student = await prisma.user.upsert({
    where: { universityId: '2020123456' },
    update: {},
    create: {
      universityId: '2020123456',
      name: 'Test Student',
      email: 'student@test.com',
      phone: '01712345678',
      role: 'STUDENT',
      password: 'dummy', // Will be set on first login
      isFirstLogin: true,
      oneTimePassword: hashedOTP,
      otpExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      department: 'Computer Science',
      year: 3,
      program: 'UNDERGRADUATE',
      session: '2020-21',
      bloodGroup: 'A_POSITIVE',
      emergencyContacts: {
        create: [
          {
            name: 'Parent Name',
            phone: '01798765432',
            relation: 'Father',
          },
        ],
      },
      guardianInfo: {
        create: {
          name: 'Guardian Name',
          phone: '01798765432',
          relation: 'Father',
          address: 'Dhaka, Bangladesh',
        },
      },
    },
  });

  console.log('✅ Test student created:', student.universityId);
  console.log('OTP for first login:', otp);

  // Create test provost
  const provost = await prisma.user.upsert({
    where: { universityId: '1990111111' },
    update: {},
    create: {
      universityId: '1990111111',
      name: 'Test Provost',
      email: 'provost@test.com',
      phone: '01812345678',
      role: 'PROVOST',
      password: await bcrypt.hash('Provost@123', 10),
      isFirstLogin: false,
      tenureStart: new Date(),
      provostMessage: 'Welcome to our hall!',
    },
  });

  console.log('✅ Test provost created:', provost.universityId);
  console.log('Password: Provost@123');

  console.log('🎉 Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
