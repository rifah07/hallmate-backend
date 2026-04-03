import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

//const prisma = new PrismaClient();
//import prisma from '../src/database/prisma/client';

dotenv.config();

const prisma = new PrismaClient();

// Simple hash function (avoid importing from src to prevent path issues)
async function hashPassword(password: string): Promise<string> {
  const rounds = parseInt(process.env.BCRYPT_ROUNDS || '10', 10);
  return bcrypt.hash(password, rounds);
}

async function main() {
  console.log('🌱 Starting database seed...');

  // Check if super admin already exists
  const existingSuperAdmin = await prisma.user.findFirst({
    where: { role: 'SUPER_ADMIN' },
  });

  if (existingSuperAdmin) {
    console.log('✅ Super Admin already exists. Skipping seed.');
    console.log(`   Email: ${existingSuperAdmin.email}`);
    console.log(`   University ID: ${existingSuperAdmin.universityId}`);
    return;
  }

  // Get credentials from environment
  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || 'admin_n@hallmate.edu.bd';
  const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD || 'SuperAdmin@123!';

  // Create the first Super Admin
  const hashedPassword = await hashPassword(superAdminPassword);

  const superAdmin = await prisma.user.create({
    data: {
      universityId: '0000000000',
      name: 'System Administrator',
      email: superAdminEmail,
      phone: '01700000000',
      role: 'SUPER_ADMIN',
      password: hashedPassword,
      oneTimePassword: hashedPassword, // Same as password initially
      isFirstLogin: false, // Already set up
      accountStatus: 'ACTIVE',
    },
  });

  console.log('✅ Super Admin created successfully!');
  console.log('\n📧 Login Credentials:');
  console.log(`   University ID: ${superAdmin.universityId}`);
  console.log(`   Email: ${superAdmin.email}`);
  console.log(`   Password: ${superAdminPassword}`);
  console.log('\n⚠️  IMPORTANT: Change this password immediately after first login!\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });