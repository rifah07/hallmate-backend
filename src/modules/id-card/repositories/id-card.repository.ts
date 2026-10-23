import prisma from '@/config/database.config';

class IdCardRepository {
  /** Only what's printed on a card or shown to the guard after a scan. */
  async findCardholder(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        universityId: true,
        role: true,
        department: true,
        session: true,
        bloodGroup: true,
        photo: true,
        accountStatus: true,
        isDeleted: true,
        currentRoom: { select: { roomNumber: true, floor: true } },
      },
    });
  }
}

export default new IdCardRepository();
