import prisma from '@/config/database.config';

class ProfileRepository {
  /**
   * Get user profile with relations
   */
  async getProfileById(userId: string) {
    return await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        universityId: true,
        role: true,
        name: true,
        email: true,
        phone: true,
        photo: true,
        accountStatus: true,
        department: true,
        year: true,
        program: true,
        session: true,
        bloodGroup: true,
        nationalId: true,
        medicalConditions: true,
        allergies: true,
        currentRoomId: true,
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
        provostMessage: true,
        tenureStart: true,
        tenureEnd: true,
        assignedFloor: true,
        designation: true,
        joiningDate: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Get user by university ID
   */
  async getUserByUniversityId(universityId: string) {
    return await prisma.user.findUnique({
      where: { universityId },
      select: {
        id: true,
        universityId: true,
        role: true,
        name: true,
        email: true,
        phone: true,
        photo: true,
        accountStatus: true,
        department: true,
        year: true,
        program: true,
        session: true,
        bloodGroup: true,
        currentRoom: {
          select: {
            roomNumber: true,
            floor: true,
            wing: true,
          },
        },
        createdAt: true,
      },
    });
  }
}

export default new ProfileRepository();
