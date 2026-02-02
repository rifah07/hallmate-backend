import prisma from '@/config/database.config';

class UserRepository {
  async findById(userId: string) {
    return await prisma.user.findUnique({
      where: { id: userId, isDeleted: false },
      include: {
        currentRoom: {
          select: {
            id: true,
            roomNumber: true,
            floor: true,
            wing: true,
            roomType: true,
          },
        },
        emergencyContacts: true,
        guardianInfo: true,
      },
    });
  }
}
export default new UserRepository();
