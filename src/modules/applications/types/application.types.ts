// src/modules/applications/types/application.types.ts

import { ApplicationType, ApplicationStatus, UserRole } from '@prisma/client';

export interface CreateApplicationInput {
  type: ApplicationType;
  data: Record<string, any>;
  attachments?: string[];
}

export interface UpdateApplicationInput {
  data?: Record<string, any>;
  attachments?: string[];
}

export interface AssignApplicationInput {
  assignedTo: string;
  assignedToRole: UserRole;
}

export interface RespondToApplicationInput {
  status: ApplicationStatus;
  responseNote: string;
}
