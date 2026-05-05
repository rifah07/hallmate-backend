import prisma from '@/config/database.config';
import { Prisma } from '@prisma/client';

const skip = (page: number, limit: number) => (page - 1) * limit;

// ─────────────────────────────────────────────
// Exported DTOs
// Defining return types here means the service
// gets compile-time guarantees about shape without
// knowing anything about Prisma internals.
// ─────────────────────────────────────────────

export type PublicProvostDTO = {
  id: string;
  name: string;
  photoUrl: string | null;
  designation: string;
  department: string | null;
  tenureStart: Date;
  tenureEnd: Date | null;
  isCurrent: boolean;
  bio: string | null;
};

/** Used by self-edit guard only — never sent to client */
export type InternalProvostDTO = PublicProvostDTO & {
  photoPublicId: string | null;
  userId: string | null;
};

// ─────────────────────────────────────────────
// Select shapes — defined once, used everywhere
// ─────────────────────────────────────────────

const provostPublicSelect = {
  id: true,
  name: true,
  photoUrl: true,
  designation: true,
  department: true,
  tenureStart: true,
  tenureEnd: true,
  isCurrent: true,
  bio: true,
} as const;

const provostInternalSelect = {
  ...provostPublicSelect,
  photoPublicId: true,
  userId: true,
} as const;

export const publicRepository = {
  findHallInfo() {
    return prisma.hallInfo.findFirst({ where: { isActive: true } });
  },

  findPageContent(page: string) {
    return prisma.publicPageContent.findUnique({ where: { page } });
  },

  findCurrentProvostUser() {
    return prisma.user.findFirst({
      where: { role: 'PROVOST', accountStatus: 'ACTIVE', isDeleted: false },
      select: {
        name: true,
        photo: true,
        designation: true,
        department: true,
        provostMessage: true,
        tenureStart: true,
        tenureEnd: true,
      },
    });
  },

  findHouseTutors() {
    return prisma.houseTutorProfile.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { floor: 'asc' }],
      select: {
        id: true,
        name: true,
        designation: true,
        department: true,
        floor: true,
        wing: true,
        email: true,
        phone: true,
        photoUrl: true,
        bio: true,
        officeHours: true,
      },
    });
  },

  findStaff(params: { page: number; limit: number; category?: string; search?: string }) {
    const where: Prisma.StaffProfileWhereInput = {
      isPublic: true,
      ...(params.category && { category: params.category as any }),
      ...(params.search && {
        OR: [
          { name: { contains: params.search, mode: 'insensitive' } },
          { designation: { contains: params.search, mode: 'insensitive' } },
          { department: { contains: params.search, mode: 'insensitive' } },
        ],
      }),
    };

    return Promise.all([
      prisma.staffProfile.findMany({
        where,
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        skip: skip(params.page, params.limit),
        take: params.limit,
        select: {
          id: true,
          name: true,
          designation: true,
          category: true,
          department: true,
          email: true,
          phone: true,
          photoUrl: true,
          bio: true,
          qualifications: true,
          joiningDate: true,
        },
      }),
      prisma.staffProfile.count({ where }),
    ]);
  },

  findFacilities(params: { category?: string }) {
    return prisma.facility.findMany({
      where: {
        isActive: true,
        ...(params.category && { category: params.category as any }),
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        slug: true,
        category: true,
        description: true,
        iconUrl: true,
        imageUrl: true,
      },
    });
  },

  findDiningInfo() {
    return prisma.diningInfo.findFirst({
      where: { isActive: true },
      select: {
        id: true,
        mealPlan: true,
        weeklyMenu: true,
        specialDiets: true,
        capacity: true,
        location: true,
        imageUrl: true,
        contactPhone: true,
        notice: true,
      },
    });
  },

  findAchievements(params: { page: number; limit: number; category?: string; year?: number }) {
    const where: Prisma.AchievementWhereInput = {
      isActive: true,
      ...(params.category && { category: params.category }),
      ...(params.year && { year: params.year }),
    };

    return Promise.all([
      prisma.achievement.findMany({
        where,
        orderBy: [{ isFeatured: 'desc' }, { year: 'desc' }, { sortOrder: 'asc' }],
        skip: skip(params.page, params.limit),
        take: params.limit,
        select: {
          id: true,
          title: true,
          description: true,
          category: true,
          imageUrl: true,
          year: true,
          isFeatured: true,
        },
      }),
      prisma.achievement.count({ where }),
    ]);
  },

  findEvents(params: {
    page: number;
    limit: number;
    search?: string;
    upcoming?: boolean;
    featured?: boolean;
  }) {
    const now = new Date();
    const where: Prisma.PublicEventWhereInput = {
      isPublished: true,
      ...(params.upcoming && { startDate: { gte: now } }),
      ...(params.featured && { isFeatured: true }),
      ...(params.search && {
        OR: [
          { title: { contains: params.search, mode: 'insensitive' } },
          { summary: { contains: params.search, mode: 'insensitive' } },
        ],
      }),
    };

    return Promise.all([
      prisma.publicEvent.findMany({
        where,
        orderBy: params.upcoming ? { startDate: 'asc' } : { startDate: 'desc' },
        skip: skip(params.page, params.limit),
        take: params.limit,
        select: {
          id: true,
          title: true,
          slug: true,
          summary: true,
          venue: true,
          imageUrl: true,
          startDate: true,
          endDate: true,
          isAllDay: true,
          tags: true,
          isFeatured: true,
        },
      }),
      prisma.publicEvent.count({ where }),
    ]);
  },

  findNotices(params: {
    page: number;
    limit: number;
    category?: string;
    priority?: string;
    search?: string;
  }) {
    const now = new Date();
    const where: Prisma.PublicNoticeWhereInput = {
      isPublished: true,
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      ...(params.category && { category: params.category }),
      ...(params.priority && { priority: params.priority as any }),
      ...(params.search && {
        OR: [
          { title: { contains: params.search, mode: 'insensitive' } },
          { summary: { contains: params.search, mode: 'insensitive' } },
        ],
      }),
    };

    return Promise.all([
      prisma.publicNotice.findMany({
        where,
        orderBy: [{ priority: 'desc' }, { publishedAt: 'desc' }],
        skip: skip(params.page, params.limit),
        take: params.limit,
        select: {
          id: true,
          title: true,
          slug: true,
          summary: true,
          priority: true,
          category: true,
          tags: true,
          pdfUrl: true,
          publishedAt: true,
          expiresAt: true,
          views: true,
        },
      }),
      prisma.publicNotice.count({ where }),
    ]);
  },

  findNoticeById(id: string) {
    const now = new Date();
    return prisma.publicNotice.findFirst({
      where: {
        id,
        isPublished: true,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      select: {
        id: true,
        title: true,
        slug: true,
        content: true,
        summary: true,
        pdfUrl: true,
        imageUrl: true,
        priority: true,
        category: true,
        tags: true,
        publishedAt: true,
        expiresAt: true,
        views: true,
        createdAt: true,
      },
    });
  },

  incrementNoticeViews(id: string) {
    return prisma.publicNotice.update({
      where: { id },
      data: { views: { increment: 1 } },
    });
  },

  findGallery(params: { page: number; limit: number; category?: string; search?: string }) {
    const where: Prisma.GalleryItemWhereInput = {
      isActive: true,
      ...(params.category && { category: params.category as any }),
      ...(params.search && {
        OR: [
          { title: { contains: params.search, mode: 'insensitive' } },
          { description: { contains: params.search, mode: 'insensitive' } },
        ],
      }),
    };

    return Promise.all([
      prisma.galleryItem.findMany({
        where,
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
        skip: skip(params.page, params.limit),
        take: params.limit,
        select: {
          id: true,
          title: true,
          description: true,
          imageUrl: true,
          thumbnailUrl: true,
          category: true,
          tags: true,
          capturedAt: true,
        },
      }),
      prisma.galleryItem.count({ where }),
    ]);
  },

  findFAQ(params: { category?: string; search?: string }) {
    return prisma.fAQ.findMany({
      where: {
        isActive: true,
        ...(params.category && { category: params.category }),
        ...(params.search && {
          OR: [
            { question: { contains: params.search, mode: 'insensitive' } },
            { answer: { contains: params.search, mode: 'insensitive' } },
          ],
        }),
      },
      orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }],
      select: { id: true, question: true, answer: true, category: true },
    });
  },

  findCurrentAdmissionInfo() {
    return prisma.admissionInfo.findFirst({
      where: { isActive: true, isCurrent: true },
      select: {
        id: true,
        session: true,
        eligibility: true,
        process: true,
        requiredDocs: true,
        importantDates: true,
        seatCapacity: true,
        applicationFee: true,
        contactEmail: true,
        contactPhone: true,
        faqItems: true,
      },
    });
  },

  createContactSubmission(data: {
    name: string;
    email: string;
    phone?: string;
    subject: string;
    message: string;
    ipAddress?: string;
  }) {
    return prisma.contactSubmission.create({
      data,
      select: { id: true, name: true, email: true, subject: true, createdAt: true },
    });
  },

  createPublicApplication(data: {
    type: any;
    status: 'PENDING';
    applicantName: string;
    applicantEmail: string;
    applicantPhone: string;
    studentId?: string;
    program?: string;
    department?: string;
    session?: string;
    subject: string;
    message: string;
    attachments: string[];
    ipAddress?: string;
  }) {
    return prisma.publicApplication.create({
      data,
      select: { id: true, type: true, status: true, createdAt: true },
    });
  },

  findApplicationById(id: string) {
    return prisma.publicApplication.findUnique({
      where: { id },
      select: {
        id: true,
        type: true,
        status: true,
        subject: true,
        responseNote: true,
        respondedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  },

  findProvostHistory() {
    return prisma.provostHistory.findMany({
      orderBy: [{ isCurrent: 'desc' }, { tenureStart: 'desc' }],
      select: provostPublicSelect,
    }) as Promise<PublicProvostDTO[]>;
  },

  /** Internal — includes userId + photoPublicId for guard/cleanup logic */
  findProvostByIdInternal(id: string) {
    return prisma.provostHistory.findUnique({
      where: { id },
      select: provostInternalSelect,
    }) as Promise<InternalProvostDTO | null>;
  },

  unmarkAllCurrentProvosts(excludeId?: string) {
    return prisma.provostHistory.updateMany({
      where: {
        isCurrent: true,
        ...(excludeId && { id: { not: excludeId } }),
      },
      data: { isCurrent: false },
    });
  },

  createProvostRecord(data: Prisma.ProvostHistoryCreateInput) {
    return prisma.provostHistory.create({
      data,
      select: provostPublicSelect,
    }) as Promise<PublicProvostDTO>;
  },

  updateProvostRecord(id: string, data: Prisma.ProvostHistoryUpdateInput) {
    return prisma.provostHistory.update({
      where: { id },
      data,
      select: provostPublicSelect,
    }) as Promise<PublicProvostDTO>;
  },

  deleteProvostRecord(id: string) {
    return prisma.provostHistory.delete({ where: { id } });
  },
};
