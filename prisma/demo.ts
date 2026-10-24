import 'dotenv/config'; // first: the client reads DATABASE_URL when imported
import bcrypt from 'bcrypt';
import { Prisma, UserRole } from '@prisma/client';
import prisma from '../src/config/database.config';

// Demo data for showing every role (docs/DEMO_ACCOUNTS.md).
//   npm run db:demo          add (re-running replaces it, so dates stay fresh)
//   npm run db:demo:remove   delete all of it
// Demo users are read-only (isDemo, see authenticate.ts); public content is
// marked isSample and badged on the site. No photos of people anywhere.

const PASSWORD = 'HallMate@Demo1';
const FLOOR = 9;
const ROOMS = ['A-901', 'A-902', 'A-903'];

type DemoUser = { id: string; name: string; role: UserRole; extra?: Partial<Prisma.UserCreateInput> };

const STAFF: DemoUser[] = [
  { id: '9900000001', name: 'Demo Administrator', role: 'SUPER_ADMIN' },
  { id: '9900000002', name: 'Demo Provost', role: 'PROVOST', extra: { designation: 'Provost' } },
  { id: '9900000003', name: 'Demo House Tutor', role: 'HOUSE_TUTOR', extra: { assignedFloor: FLOOR, department: 'Department of Botany' } },
  { id: '9900000004', name: 'Demo Guard', role: 'GUARD', extra: { designation: 'Security guard' } },
  { id: '9900000005', name: 'Demo Dining Staff', role: 'DINING_STAFF', extra: { designation: 'Dining supervisor' } },
  { id: '9900000006', name: 'Demo Maintenance Staff', role: 'MAINTENANCE_STAFF', extra: { designation: 'Electrician' } },
  { id: '9900000007', name: 'Demo Office Staff', role: 'OFFICE_STAFF', extra: { designation: 'Cleaner' } },
];

// Residents: the first two are the documented logins; the rest fill the rooms.
const RESIDENTS: DemoUser[] = [
  ['9900000011', 'Nusrat Jahan', 'Department of English'],
  ['9900000012', 'Tahmina Akter', 'Department of Mathematics'],
  ['9900000013', 'Sadia Islam', 'Department of Chemistry'],
  ['9900000014', 'Farzana Rahman', 'Department of Economics'],
  ['9900000015', 'Mehjabin Hossain', 'Department of Bangla'],
  ['9900000016', 'Rumana Sultana', 'Department of Physics'],
  ['9900000017', 'Lamia Chowdhury', 'Department of Finance'],
].map(([id, name, department]) => ({
  id,
  name,
  role: 'STUDENT' as const,
  extra: { department, year: 3, session: '2022-23', program: 'UNDERGRADUATE' as const },
}));

const DEMO_IDS = [...STAFF, ...RESIDENTS].map((u) => u.id);
const daysFromNow = (n: number) => new Date(Date.now() + n * 86_400_000);
// Pohela Boishakh is always 14 April: the next one from today
const nextBoishakh = () => {
  const now = new Date();
  const thisYear = new Date(Date.UTC(now.getUTCFullYear(), 3, 14));
  return thisYear > now ? thisYear : new Date(Date.UTC(now.getUTCFullYear() + 1, 3, 14));
};

async function addUsers() {
  const password = await bcrypt.hash(PASSWORD, 12);
  const ids: Record<string, string> = {};
  for (const u of [...STAFF, ...RESIDENTS]) {
    const user = await prisma.user.create({
      data: {
        universityId: u.id,
        name: u.name,
        // Placeholders only: example.com never delivers, and no real number looks like this
        email: `demo${u.id.slice(-2)}@example.com`,
        phone: '017XXXXXXXX',
        role: u.role,
        password,
        isFirstLogin: false,
        accountStatus: 'ACTIVE',
        isDemo: true,
        ...u.extra,
      },
    });
    ids[u.id] = user.id;
  }
  return ids;
}

async function addRooms(ids: Record<string, string>) {
  // Seven residents in three four-bed rooms, leaving free beds to assign and move people into
  for (const [r, roomNumber] of ROOMS.entries()) {
    const residents = RESIDENTS.slice(r * 3, r * 3 + 3);
    const room = await prisma.room.create({
      data: {
        roomNumber,
        floor: FLOOR,
        wing: 'A',
        roomType: 'FOUR_SHARING',
        capacity: 4,
        currentOccupancy: residents.length,
        status: residents.length ? 'PARTIALLY_OCCUPIED' : 'AVAILABLE',
      },
    });
    for (const [b, resident] of residents.entries()) {
      await prisma.roomOccupant.create({ data: { roomId: room.id, userId: ids[resident.id], bedNumber: b + 1 } });
      await prisma.user.update({ where: { id: ids[resident.id] }, data: { currentRoomId: room.id } });
    }
  }
}

async function addResidentLife(ids: Record<string, string>) {
  const admin = ids['9900000001'];
  const provost = ids['9900000002'];
  const [nusrat, tahmina, sadia] = RESIDENTS.map((r) => ids[r.id]);

  for (const [i, r] of RESIDENTS.entries()) {
    await prisma.bill.create({
      data: {
        type: 'SEAT_RENEWAL',
        title: 'Seat renewal 2026',
        period: '2026',
        studentId: ids[r.id],
        amount: 1800,
        dueDate: daysFromNow(20),
        createdBy: admin,
        ...(i % 3 === 1 && { status: 'PAID', paidAt: daysFromNow(-3) }),
      },
    });
  }

  const requests: Prisma.ApplicationCreateManyInput[] = [
    {
      type: 'LEAVE',
      studentId: nusrat,
      data: {
        leaveType: 'SHORT_LEAVE',
        startDate: daysFromNow(5).toISOString().slice(0, 10),
        endDate: daysFromNow(8).toISOString().slice(0, 10),
        destination: 'Home, Mymensingh',
        reason: 'Family wedding over the weekend.',
        emergencyContact: { name: 'Shahana Begum', relation: 'Mother', phone: '017XXXXXXXX' },
      },
    },
    {
      type: 'MAINTENANCE',
      studentId: tahmina,
      status: 'APPROVED',
      assignedTo: ids['9900000006'],
      assignedToRole: 'MAINTENANCE_STAFF',
      data: { category: 'Electrical', location: 'Room A-901, ceiling fan', description: 'The ceiling fan stops after a few minutes and makes a burning smell.' },
    },
    {
      type: 'COMPLAINT',
      studentId: sadia,
      data: { category: 'CLEANLINESS', title: 'Bathroom on floor 9 not cleaned', description: 'The shared bathroom near A-903 has not been cleaned for two days.', location: 'Floor 9, wing A' },
    },
  ];
  await prisma.application.createMany({ data: requests });

  await prisma.visitor.createMany({
    data: [
      { name: 'Shahana Begum', phone: '017XXXXXXXX', relation: 'Mother', purpose: 'Bringing winter clothes', visitDate: new Date(), status: 'APPROVED', studentId: nusrat, decidedBy: ids['9900000003'], decidedAt: new Date() },
      { name: 'Rokeya Khatun', phone: '017XXXXXXXX', relation: 'Aunt', purpose: 'Visit', visitDate: daysFromNow(2), status: 'PENDING', studentId: tahmina },
    ],
  });

  await prisma.notice.createMany({
    data: [
      { title: 'Seat renewal fees for 2026 are open', content: 'Pay online from Bills, or at the hall office by the due date.', audience: 'ALL', priority: 'HIGH', createdBy: provost, createdByRole: 'PROVOST' },
      { title: 'Floor 9: water off on Saturday morning', content: 'The tank is being cleaned from 9 am to 12 noon. Please store water the night before.', audience: 'FLOOR', targetFloor: FLOOR, priority: 'NORMAL', createdBy: ids['9900000003'], createdByRole: 'HOUSE_TUTOR' },
    ],
  });

  await prisma.notification.createMany({
    data: [
      { userId: nusrat, type: 'VISITOR', title: 'Visitor approved', message: 'Shahana Begum may visit you today.' },
      { userId: nusrat, type: 'BILL', title: 'New bill', message: 'Seat renewal 2026: ৳1,800, due in 20 days.' },
    ],
  });
}

// Public pages: every row is isSample, so the site badges it.
async function addPublicSamples() {
  const isSample = true;
  await prisma.publicEvent.createMany({
    data: [
      { title: 'Pohela Boishakh in the courtyard', slug: 'sample-pohela-boishakh', summary: 'Alpana, songs and panta-ilish to welcome the new Bangla year.', description: 'Residents paint an alpana in the courtyard at dawn, followed by songs, recitation and a shared breakfast of panta-ilish. Everyone in the hall is welcome.', venue: 'Hall courtyard', imageUrl: '/illustrations/event-boishakh.svg', startDate: nextBoishakh(), isAllDay: true, isPublished: true, isFeatured: true, tags: ['cultural'], isSample },
      { title: 'Fire safety drill with the fire service', slug: 'sample-fire-drill', summary: 'How to use an extinguisher and leave the building safely.', description: 'The fire service shows every floor how to use an extinguisher, where the exits are and how to leave the 16-storey building calmly.', venue: 'Ground floor and stairwells', imageUrl: '/illustrations/event-fire-drill.svg', startDate: daysFromNow(12), isPublished: true, tags: ['safety'], isSample },
      { title: 'Health awareness morning', slug: 'sample-health-morning', summary: 'Free check-ups and a talk on nutrition during exams.', description: 'Doctors from the university medical centre run free check-ups and talk about eating and sleeping well during exams.', venue: 'Common room', imageUrl: '/illustrations/event-health.svg', startDate: daysFromNow(-20), isPublished: true, tags: ['health'], isSample },
    ],
  });

  await prisma.achievement.createMany({
    data: [
      { title: 'Inter-hall debate champions', description: 'A team of three residents won the university inter-hall debate final.', category: 'Academic', year: 2026, isFeatured: true, isSample },
      { title: 'Cleanest hall award', description: 'Recognised by the university for keeping every floor clean throughout the year.', category: 'Campus', year: 2025, isSample },
      { title: 'Blood donation drive', description: 'Residents donated 120 bags of blood in one day with the medical centre.', category: 'Community', year: 2025, isSample },
    ],
  });

  await prisma.fAQ.createMany({
    data: [
      { category: 'Admission', question: 'Who can apply for a seat?', answer: 'Women students of Jagannath University with a valid student ID. Seats are allocated by merit and need.', isSample },
      { category: 'Admission', question: 'How do I know my application status?', answer: 'Use Track application with the ID you received after applying.', isSample },
      { category: 'Living', question: 'Can I switch off meals when I eat out?', answer: 'Yes. From Meals in your dashboard, up to 24 hours before the meal.', isSample },
      { category: 'Living', question: 'When can visitors come?', answer: 'Register them in Visitors; your house tutor approves, and the guard checks them in on the day.', isSample },
      { category: 'Fees', question: 'How do I pay the seat renewal fee?', answer: 'Online from Bills (bKash, Nagad, Rocket or card), or at the hall office.', isSample },
      { category: 'Safety', question: 'What if I lose my ID card?', answer: 'Your digital ID card is always in the dashboard; tell the hall office so the old one can be stopped.', isSample },
    ],
  });

  await prisma.diningInfo.create({
    data: {
      mealPlan: [
        { meal: 'Breakfast', time: '7:30 – 9:30 am', price: 30 },
        { meal: 'Lunch', time: '1:00 – 3:00 pm', price: 50 },
        { meal: 'Dinner', time: '8:00 – 10:00 pm', price: 50 },
      ],
      weeklyMenu: [
        { day: 'Saturday', lunch: 'Rice, rui fish, dal, vegetables', dinner: 'Rice, chicken curry, dal' },
        { day: 'Sunday', lunch: 'Rice, egg curry, dal, bharta', dinner: 'Khichuri, beef bhuna' },
        { day: 'Monday', lunch: 'Rice, chicken, dal, salad', dinner: 'Rice, pangas fish, vegetables' },
        { day: 'Tuesday', lunch: 'Rice, beef curry, dal', dinner: 'Rice, egg bhuna, dal' },
        { day: 'Wednesday', lunch: 'Rice, ilish fish, dal', dinner: 'Rice, chicken, mixed vegetables' },
        { day: 'Thursday', lunch: 'Rice, mutton, dal, salad', dinner: 'Polao, chicken roast' },
        { day: 'Friday', lunch: 'Rice, rui fish, dal', dinner: 'Rice, beef, dal' },
      ],
      specialDiets: ['Vegetarian on request', 'Diabetic-friendly plate'],
      capacity: 300,
      location: 'Ground floor, dining hall',
      notice: 'Switch off a meal from your dashboard at least 24 hours ahead.',
      isSample,
    },
  });

  await prisma.admissionInfo.create({
    data: {
      session: '2026-27',
      eligibility: 'Women students of Jagannath University, enrolled in an undergraduate or master’s programme, who live outside commuting distance of the campus.',
      process: 'Apply online with your university ID. The provost’s office reviews applications, may call you for an interview, and publishes the allocation list on the notice board.',
      requiredDocs: ['University ID card', 'Last semester result', 'Guardian’s consent letter', 'Two passport-size photos'],
      importantDates: [
        { label: 'Applications open', date: daysFromNow(10).toISOString().slice(0, 10) },
        { label: 'Applications close', date: daysFromNow(30).toISOString().slice(0, 10) },
        { label: 'Allocation list', date: daysFromNow(45).toISOString().slice(0, 10) },
      ],
      seatCapacity: 120,
      applicationFee: 200,
      isCurrent: true,
      isSample,
    },
  });

  await prisma.publicNotice.createMany({
    data: [
      { title: 'Seat renewal for 2026', slug: 'sample-seat-renewal-2026', content: 'All residents must renew their seats for 2026 by the due date. Pay online from the dashboard or at the hall office.', pdfUrl: '/samples/seat-renewal-2026.pdf', priority: 'HIGH', category: 'Fees', isPublished: true, publishedAt: daysFromNow(-2), isSample },
      { title: 'Fire safety drill on all floors', slug: 'sample-fire-drill-notice', content: 'Every resident must join the fire safety drill. Gather at the courtyard when the alarm sounds.', pdfUrl: '/samples/fire-drill.pdf', priority: 'NORMAL', category: 'Safety', isPublished: true, publishedAt: daysFromNow(-6), isSample },
    ],
  });

  await prisma.galleryItem.createMany({
    data: [
      ['The hall at dusk', 'INFRASTRUCTURE', 'gallery-hall.svg'],
      ['Reading room', 'ACADEMICS', 'gallery-library.svg'],
      ['Dining hall', 'DINING', 'gallery-dining.svg'],
      ['Courtyard garden', 'GENERAL', 'gallery-garden.svg'],
      ['Alpana for Pohela Boishakh', 'CULTURAL', 'event-boishakh.svg'],
      ['Badminton court', 'SPORTS', 'gallery-badminton.svg'],
    ].map(([title, category, file], i) => ({
      title,
      category: category as 'GENERAL',
      imageUrl: `/illustrations/${file}`,
      sortOrder: i,
      isSample,
    })),
  });

  // One floor per tutor (5, 6, 7, 8) until the hall office sets the real ones
  const tutors = await prisma.houseTutorProfile.findMany({ orderBy: { sortOrder: 'asc' } });
  for (const [i, t] of tutors.entries()) {
    await prisma.houseTutorProfile.update({ where: { id: t.id }, data: { floor: 5 + i, isSample } });
  }
}

async function remove() {
  const user = { universityId: { in: DEMO_IDS } };
  await prisma.notification.deleteMany({ where: { user } });
  await prisma.visitor.deleteMany({ where: { student: user } });
  await prisma.application.deleteMany({ where: { student: user } });
  await prisma.payment.deleteMany({ where: { bill: { student: user } } });
  await prisma.bill.deleteMany({ where: { student: user } });
  await prisma.complaint.deleteMany({ where: { student: user } });
  await prisma.mealCancellation.deleteMany({ where: { student: user } });
  await prisma.roomOccupant.deleteMany({ where: { user } });
  await prisma.refreshToken.deleteMany({ where: { user } });
  const demoUsers = await prisma.user.findMany({ where: user, select: { id: true } });
  await prisma.notice.deleteMany({ where: { createdBy: { in: demoUsers.map((u) => u.id) } } });
  await prisma.user.deleteMany({ where: user });
  await prisma.room.deleteMany({ where: { roomNumber: { in: ROOMS } } });

  const isSample = true;
  await prisma.publicEvent.deleteMany({ where: { isSample } });
  await prisma.achievement.deleteMany({ where: { isSample } });
  await prisma.fAQ.deleteMany({ where: { isSample } });
  await prisma.diningInfo.deleteMany({ where: { isSample } });
  await prisma.admissionInfo.deleteMany({ where: { isSample } });
  await prisma.publicNotice.deleteMany({ where: { isSample } });
  await prisma.galleryItem.deleteMany({ where: { isSample } });
  await prisma.houseTutorProfile.updateMany({ where: { isSample }, data: { floor: null, isSample: false } });
}

async function main() {
  await remove();
  if (process.argv[2] === 'remove') return console.log('🧹 Demo data removed.');
  const ids = await addUsers();
  await addRooms(ids);
  await addResidentLife(ids);
  await addPublicSamples();
  console.log(`✅ Demo data added: ${DEMO_IDS.length} read-only users (password ${PASSWORD}), sample public content.`);
}

main()
  .catch((error) => {
    console.error('❌ Demo script failed:', error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
