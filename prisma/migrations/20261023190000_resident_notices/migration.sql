-- CreateEnum
CREATE TYPE "NoticeAudience" AS ENUM ('ALL', 'FLOOR');

-- DropIndex
DROP INDEX "Notice_createdAt_idx";

-- DropIndex
DROP INDEX "Notice_isActive_isPublic_idx";

-- AlterTable
ALTER TABLE "Notice" DROP COLUMN "category",
DROP COLUMN "imageUrl",
DROP COLUMN "isPublic",
DROP COLUMN "targetAudience",
DROP COLUMN "targetValue",
DROP COLUMN "views",
ADD COLUMN     "audience" "NoticeAudience" NOT NULL DEFAULT 'ALL',
ADD COLUMN     "targetFloor" INTEGER,
DROP COLUMN "priority",
ADD COLUMN     "priority" "NoticePriority" NOT NULL DEFAULT 'NORMAL';

-- CreateIndex
CREATE INDEX "Notice_isActive_audience_targetFloor_createdAt_idx" ON "Notice"("isActive", "audience", "targetFloor", "createdAt");

