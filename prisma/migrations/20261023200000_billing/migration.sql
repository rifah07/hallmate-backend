-- AlterEnum
BEGIN;
CREATE TYPE "BillStatus_new" AS ENUM ('UNPAID', 'PAID', 'CANCELLED');
ALTER TABLE "public"."Bill" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Bill" ALTER COLUMN "status" TYPE "BillStatus_new" USING ("status"::text::"BillStatus_new");
ALTER TYPE "BillStatus" RENAME TO "BillStatus_old";
ALTER TYPE "BillStatus_new" RENAME TO "BillStatus";
DROP TYPE "public"."BillStatus_old";
ALTER TABLE "Bill" ALTER COLUMN "status" SET DEFAULT 'UNPAID';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "BillType_new" AS ENUM ('SEAT_RENEWAL', 'FINE', 'OTHER');
ALTER TABLE "Bill" ALTER COLUMN "type" TYPE "BillType_new" USING ("type"::text::"BillType_new");
ALTER TYPE "BillType" RENAME TO "BillType_old";
ALTER TYPE "BillType_new" RENAME TO "BillType";
DROP TYPE "public"."BillType_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "PaymentGateway_new" AS ENUM ('SSLCOMMERZ', 'CASH', 'BANK_TRANSFER');
ALTER TABLE "Payment" ALTER COLUMN "gateway" TYPE "PaymentGateway_new" USING ("gateway"::text::"PaymentGateway_new");
ALTER TYPE "PaymentGateway" RENAME TO "PaymentGateway_old";
ALTER TYPE "PaymentGateway_new" RENAME TO "PaymentGateway";
DROP TYPE "public"."PaymentGateway_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "PaymentStatus_new" AS ENUM ('PENDING', 'SUCCESS', 'FAILED');
ALTER TABLE "public"."Payment" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Payment" ALTER COLUMN "status" TYPE "PaymentStatus_new" USING ("status"::text::"PaymentStatus_new");
ALTER TYPE "PaymentStatus" RENAME TO "PaymentStatus_old";
ALTER TYPE "PaymentStatus_new" RENAME TO "PaymentStatus";
DROP TYPE "public"."PaymentStatus_old";
ALTER TABLE "Payment" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- DropIndex
DROP INDEX "Bill_dueDate_idx";

-- DropIndex
DROP INDEX "Bill_status_idx";

-- DropIndex
DROP INDEX "Bill_studentId_idx";

-- DropIndex
DROP INDEX "Bill_studentId_type_month_year_key";

-- DropIndex
DROP INDEX "Payment_status_idx";

-- DropIndex
DROP INDEX "Payment_studentId_idx";

-- DropIndex
DROP INDEX "Payment_transactionId_idx";

-- DropIndex
DROP INDEX "Payment_transactionId_key";

-- AlterTable
ALTER TABLE "Bill" DROP COLUMN "lateFee",
DROP COLUMN "month",
DROP COLUMN "year",
ADD COLUMN     "createdBy" TEXT NOT NULL,
ADD COLUMN     "period" TEXT NOT NULL,
ADD COLUMN     "title" TEXT NOT NULL,
ALTER COLUMN "amount" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "Payment" DROP COLUMN "transactionId",
ADD COLUMN     "method" TEXT,
ADD COLUMN     "recordedBy" TEXT,
ADD COLUMN     "reference" TEXT,
ALTER COLUMN "amount" SET DATA TYPE INTEGER;

-- CreateIndex
CREATE INDEX "Bill_studentId_createdAt_idx" ON "Bill"("studentId", "createdAt");

-- CreateIndex
CREATE INDEX "Bill_status_dueDate_idx" ON "Bill"("status", "dueDate");

-- CreateIndex
CREATE UNIQUE INDEX "Bill_studentId_type_period_key" ON "Bill"("studentId", "type", "period");

-- CreateIndex
CREATE INDEX "Payment_studentId_createdAt_idx" ON "Payment"("studentId", "createdAt");

