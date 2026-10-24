import 'dotenv/config'; // first: the client reads DATABASE_URL when imported
import bcrypt from 'bcrypt';
import { v2 as cloudinary } from 'cloudinary';
import prisma from '../src/config/database.config';
import content from './data/hall-content.json';

// Simple hash function (avoid importing from src to prevent path issues)
async function hashPassword(password: string): Promise<string> {
  const rounds = parseInt(process.env.BCRYPT_ROUNDS || '10', 10);
  return bcrypt.hash(password, rounds);
}

async function seedSuperAdmin() {
  const existingSuperAdmin = await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN' } });
  if (existingSuperAdmin) {
    console.log(`✅ Super Admin already exists (${existingSuperAdmin.universityId}). Skipping.`);
    return;
  }

  // No defaults: a fallback password in the code is a published password
  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL;
  const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD;
  if (!superAdminEmail || !superAdminPassword || superAdminPassword.length < 12) {
    throw new Error(
      'Set SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD (12+ characters) before seeding',
    );
  }

  const superAdmin = await prisma.user.create({
    data: {
      universityId: '0000000000',
      name: 'System Administrator',
      email: superAdminEmail,
      phone: '01700000000',
      role: 'SUPER_ADMIN',
      password: await hashPassword(superAdminPassword),
      isFirstLogin: false, // Already set up
      accountStatus: 'ACTIVE',
    },
  });

  console.log('✅ Super Admin created successfully!');
  console.log(`   University ID: ${superAdmin.universityId}`);
  console.log(`   Email: ${superAdmin.email}`);
  console.log('   Password: the SUPER_ADMIN_PASSWORD you set (never printed)');
  console.log('⚠️  Change this password after the first login.');
}

// ─────────────────────────────────────────────
// Public site content, from prisma/data/hall-content.json
// ─────────────────────────────────────────────

const mirroring = Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_SECRET);
if (mirroring) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

/**
 * Copies a file from the old hall site into our Cloudinary (Cloudinary
 * fetches it itself), so the new site doesn't depend on the old server.
 * Without Cloudinary, or if the copy fails, the original link is kept.
 */
async function mirror(url: string | undefined, folder: string, kind: 'image' | 'raw' = 'image') {
  if (!url || !mirroring) return url;
  try {
    const uploaded = await cloudinary.uploader.upload(url, {
      folder: `hallmate/${folder}`,
      resource_type: kind,
    });
    return uploaded.secure_url;
  } catch (error) {
    console.warn(`   ⚠️  Kept the original link (copy failed): ${url}`, (error as Error).message);
    return url;
  }
}

async function seedHallContent() {
  // Once only: after this, the hall edits its own content through the admin API
  if ((await prisma.hallInfo.count()) > 0) {
    console.log('✅ Hall content already exists. Skipping.');
    return;
  }
  console.log(`🏛️  Seeding hall content${mirroring ? ' (copying files to Cloudinary)' : ''}...`);
  const { hallInfo, provosts, houseTutors, staff, facilities, notices, gallery } = content;

  await prisma.hallInfo.create({
    data: { ...hallInfo, logoUrl: await mirror(hallInfo.logoUrl, 'site') },
  });

  for (const [i, p] of provosts.entries()) {
    await prisma.provostHistory.create({
      data: {
        name: p.name,
        department: p.department,
        bio: p.bio,
        tenureStart: new Date(p.tenureStart),
        tenureEnd: p.tenureEnd ? new Date(p.tenureEnd) : null,
        isCurrent: Boolean(p.isCurrent),
        photoUrl: await mirror(p.photo, 'provosts'),
        sortOrder: i,
      },
    });
  }

  await prisma.houseTutorProfile.createMany({
    data: houseTutors.map((t, i) => ({ ...t, sortOrder: i })),
  });

  for (const [i, s] of staff.entries()) {
    const { photo, ...profile } = s;
    await prisma.staffProfile.create({
      data: {
        ...profile,
        category: s.category as 'ADMINISTRATIVE',
        photoUrl: await mirror(photo, 'staff'),
        sortOrder: i,
      },
    });
  }

  for (const [i, f] of facilities.entries()) {
    const { image, ...facility } = f;
    await prisma.facility.create({
      data: {
        ...facility,
        category: f.category as 'DINING',
        imageUrl: await mirror(image, 'facilities'),
        sortOrder: i,
      },
    });
  }

  for (const n of notices) {
    await prisma.publicNotice.create({
      data: {
        title: n.title,
        slug: n.slug,
        content: n.title, // the hall publishes the full text as the PDF
        category: n.category,
        pdfUrl: await mirror(n.pdf, 'notices', 'raw'),
        isPublished: true,
        publishedAt: new Date(n.date),
        createdAt: new Date(n.date),
      },
    });
  }

  for (const [i, g] of gallery.entries()) {
    const imageUrl = (await mirror(g.image, 'gallery')) as string;
    await prisma.galleryItem.create({
      data: { title: g.title, imageUrl, category: g.category as 'EVENTS', sortOrder: i },
    });
  }

  console.log(
    `✅ Hall content: ${provosts.length} provosts, ${houseTutors.length} house tutors, ` +
      `${staff.length} staff, ${facilities.length} facilities, ${notices.length} notices, ` +
      `${gallery.length} photos`,
  );
}

async function main() {
  console.log('🌱 Starting database seed...');
  await seedSuperAdmin();
  await seedHallContent();
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
