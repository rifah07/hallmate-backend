-- AlterEnum
ALTER TYPE "AccountStatus" ADD VALUE 'LOCKED';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0;
