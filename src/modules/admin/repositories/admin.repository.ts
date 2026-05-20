import prisma from '@/config/database.config';

function makeCRUD<
  TDelegate extends {
    findUnique: (args: any) => Promise<any>;
    create: (args: any) => Promise<any>;
    update: (args: any) => Promise<any>;
    delete: (args: any) => Promise<any>;
    findMany: (args: any) => Promise<any>;
    count: (args: any) => Promise<number>;
  },
>(delegate: TDelegate) {
  return {
    findById: (id: string) =>
      delegate.findUnique({ where: { id } }) as ReturnType<TDelegate['findUnique']>,

    create: (data: any) => delegate.create({ data }) as ReturnType<TDelegate['create']>,

    update: (id: string, data: any) =>
      delegate.update({ where: { id }, data }) as ReturnType<TDelegate['update']>,

    delete: (id: string) => delegate.delete({ where: { id } }) as ReturnType<TDelegate['delete']>,
  };
}

// ─────────────────────────────────────────────
// Per-model CRUD instances — one line each
// ─────────────────────────────────────────────

export const hallInfoRepo = makeCRUD(prisma.hallInfo);
export const facilityRepo = makeCRUD(prisma.facility);
export const faqRepo = makeCRUD(prisma.fAQ);
export const diningRepo = makeCRUD(prisma.diningInfo);
export const achievementRepo = makeCRUD(prisma.achievement);
export const noticeRepo = makeCRUD(prisma.publicNotice);
export const eventRepo = makeCRUD(prisma.publicEvent);
export const galleryRepo = makeCRUD(prisma.galleryItem);
export const houseTutorRepo = makeCRUD(prisma.houseTutorProfile);
export const staffRepo = makeCRUD(prisma.staffProfile);
export const admissionRepo = makeCRUD(prisma.admissionInfo);
export const pageContentRepo = makeCRUD(prisma.publicPageContent);

// ─────────────────────────────────────────────
// Specialty queries that don't fit the generic
// pattern — kept here so service stays Prisma-free
// ─────────────────────────────────────────────

export const adminRepository = {
  /** Enforce single active hall info */
  deactivateAllHallInfo: () =>
    prisma.hallInfo.updateMany({ where: { isActive: true }, data: { isActive: false } }),

  /** Enforce single current admission */
  deactivateCurrentAdmission: (excludeId?: string) =>
    prisma.admissionInfo.updateMany({
      where: { isCurrent: true, ...(excludeId && { id: { not: excludeId } }) },
      data: { isCurrent: false },
    }),

  /** Check slug uniqueness for models that have slugs */
  isSlugTaken: async (
    model: 'publicNotice' | 'publicEvent' | 'facility',
    slug: string,
    excludeId?: string,
  ): Promise<boolean> => {
    const record = await (prisma[model] as any).findFirst({
      where: { slug, ...(excludeId && { id: { not: excludeId } }) },
      select: { id: true },
    });
    return !!record;
  },
};
