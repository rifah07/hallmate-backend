import { UserRole, AccountStatus, Program, BloodGroup } from '@prisma/client';

/**
 * User Response DTO (Data Transfer Object)
 * What we return to the client (excludes sensitive data)
 */
export interface UserResponse {
  id: string;
  universityId: string;
  role: UserRole;
  name: string;
  email: string;
  phone: string;
  photo?: string;
  accountStatus: AccountStatus;

  // Student-specific
  department?: string;
  year?: number;
  program?: Program;
  session?: string;
  bloodGroup?: BloodGroup;
  medicalConditions?: string;
  allergies?: string;

  // Room info
  currentRoomId?: string;
  currentRoom?: {
    id: string;
    roomNumber: string;
    floor: number;
    wing: string;
    roomType: string;
  };

  // Provost-specific
  provostMessage?: string;
  tenureStart?: Date;
  tenureEnd?: Date;

  // House Tutor-specific
  assignedFloor?: number;

  // Staff-specific
  designation?: string;
  joiningDate?: Date;

  createdAt: Date;
  updatedAt: Date;
}
