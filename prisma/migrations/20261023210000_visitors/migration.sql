-- CreateEnum
CREATE TYPE "VisitorStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'CHECKED_IN', 'CHECKED_OUT');

-- DropForeignKey
ALTER TABLE "GateEntry" DROP CONSTRAINT "GateEntry_studentId_fkey";

-- DropForeignKey
ALTER TABLE "Visitor" DROP CONSTRAINT "Visitor_studentId_fkey";

-- DropIndex
DROP INDEX "Visitor_entryTime_idx";

-- DropIndex
DROP INDEX "Visitor_studentId_idx";

-- AlterTable
ALTER TABLE "Visitor" DROP COLUMN "approved",
DROP COLUMN "approvedAt",
DROP COLUMN "entryTime",
DROP COLUMN "exitTime",
DROP COLUMN "nidNumber",
DROP COLUMN "photo",
ADD COLUMN     "checkedInAt" TIMESTAMP(3),
ADD COLUMN     "checkedOutAt" TIMESTAMP(3),
ADD COLUMN     "decidedAt" TIMESTAMP(3),
ADD COLUMN     "decidedBy" TEXT,
ADD COLUMN     "decisionNote" TEXT,
ADD COLUMN     "guardId" TEXT,
ADD COLUMN     "status" "VisitorStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "visitDate" DATE NOT NULL;

-- DropTable
DROP TABLE "GateEntry";

-- CreateIndex
CREATE INDEX "Visitor_studentId_createdAt_idx" ON "Visitor"("studentId", "createdAt");

-- CreateIndex
CREATE INDEX "Visitor_visitDate_status_idx" ON "Visitor"("visitDate", "status");

-- AddForeignKey
ALTER TABLE "Visitor" ADD CONSTRAINT "Visitor_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

