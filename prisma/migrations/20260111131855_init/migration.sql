-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'PROVOST', 'HOUSE_TUTOR', 'ASSISTANT_WARDEN', 'OFFICE_STAFF', 'DINING_STAFF', 'MAINTENANCE_STAFF', 'GUARD', 'STUDENT', 'PARENT');

-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'SEAT_CANCELLED', 'INACTIVE', 'GRADUATED');

-- CreateEnum
CREATE TYPE "Program" AS ENUM ('UNDERGRADUATE', 'MASTERS', 'PHD');

-- CreateEnum
CREATE TYPE "BloodGroup" AS ENUM ('A_POSITIVE', 'A_NEGATIVE', 'B_POSITIVE', 'B_NEGATIVE', 'O_POSITIVE', 'O_NEGATIVE', 'AB_POSITIVE', 'AB_NEGATIVE');

-- CreateEnum
CREATE TYPE "RoomType" AS ENUM ('SINGLE', 'DOUBLE', 'TRIPLE', 'FOUR_SHARING');

-- CreateEnum
CREATE TYPE "RoomStatus" AS ENUM ('AVAILABLE', 'OCCUPIED', 'PARTIALLY_OCCUPIED', 'MAINTENANCE', 'RESERVED');

-- CreateEnum
CREATE TYPE "Wing" AS ENUM ('A', 'B');

-- CreateEnum
CREATE TYPE "ApplicationType" AS ENUM ('SEAT_APPLICATION', 'SEAT_CANCELLATION', 'SEAT_TRANSFER', 'SEAT_SWAP', 'LEAVE', 'COMPLAINT', 'MAINTENANCE');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "LeaveType" AS ENUM ('SHORT_LEAVE', 'LONG_LEAVE', 'OVERNIGHT', 'MEDICAL', 'EMERGENCY');

-- CreateEnum
CREATE TYPE "ComplaintCategory" AS ENUM ('ELECTRICAL', 'PLUMBING', 'FURNITURE', 'CLEANLINESS', 'MESS_FOOD', 'NOISE', 'SECURITY', 'HARASSMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "ComplaintPriority" AS ENUM ('LOW', 'NORMAL', 'URGENT', 'EMERGENCY');

-- CreateEnum
CREATE TYPE "ComplaintStatus" AS ENUM ('SUBMITTED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "BillType" AS ENUM ('RENT', 'MESS', 'ELECTRICITY', 'FINE', 'CAUTION_MONEY', 'OTHER');

-- CreateEnum
CREATE TYPE "BillStatus" AS ENUM ('UNPAID', 'PROCESSING', 'PAID', 'OVERDUE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentGateway" AS ENUM ('BKASH', 'NAGAD', 'BANK_TRANSFER', 'CASH', 'SSLCOMMERZ');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "universityId" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "photo" TEXT,
    "password" TEXT NOT NULL,
    "accountStatus" "AccountStatus" NOT NULL DEFAULT 'ACTIVE',
    "isFirstLogin" BOOLEAN NOT NULL DEFAULT true,
    "oneTimePassword" TEXT,
    "otpExpiresAt" TIMESTAMP(3),
    "passwordChangedAt" TIMESTAMP(3),
    "passwordResetToken" TEXT,
    "passwordResetExpires" TIMESTAMP(3),
    "cancellationReason" TEXT,
    "cancelledBy" TEXT,
    "cancelledAt" TIMESTAMP(3),
    "department" TEXT,
    "year" INTEGER,
    "program" "Program",
    "session" TEXT,
    "bloodGroup" "BloodGroup",
    "nationalId" TEXT,
    "studentPhoto" TEXT,
    "medicalConditions" TEXT,
    "allergies" TEXT,
    "currentRoomId" TEXT,
    "provostMessage" TEXT,
    "tenureStart" TIMESTAMP(3),
    "tenureEnd" TIMESTAMP(3),
    "assignedFloor" INTEGER,
    "designation" TEXT,
    "joiningDate" TIMESTAMP(3),
    "createdBy" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmergencyContact" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "relation" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmergencyContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuardianInfo" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "relation" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GuardianInfo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Room" (
    "id" TEXT NOT NULL,
    "roomNumber" TEXT NOT NULL,
    "floor" INTEGER NOT NULL,
    "wing" "Wing" NOT NULL,
    "roomType" "RoomType" NOT NULL,
    "capacity" INTEGER NOT NULL,
    "currentOccupancy" INTEGER NOT NULL DEFAULT 0,
    "status" "RoomStatus" NOT NULL DEFAULT 'AVAILABLE',
    "furnitureInventory" JSONB,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Room_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeatAllocation" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "allocatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "vacatedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SeatAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Application" (
    "id" TEXT NOT NULL,
    "type" "ApplicationType" NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "studentId" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "attachments" TEXT[],
    "assignedTo" TEXT,
    "assignedToRole" "UserRole",
    "responseNote" TEXT,
    "respondedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Complaint" (
    "id" TEXT NOT NULL,
    "category" "ComplaintCategory" NOT NULL,
    "priority" "ComplaintPriority" NOT NULL DEFAULT 'NORMAL',
    "status" "ComplaintStatus" NOT NULL DEFAULT 'SUBMITTED',
    "studentId" TEXT NOT NULL,
    "roomId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "attachments" TEXT[],
    "assignedTo" TEXT,
    "assignedAt" TIMESTAMP(3),
    "resolutionNote" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Complaint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bill" (
    "id" TEXT NOT NULL,
    "type" "BillType" NOT NULL,
    "status" "BillStatus" NOT NULL DEFAULT 'UNPAID',
    "studentId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "paidAt" TIMESTAMP(3),
    "lateFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Bill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "billId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "gateway" "PaymentGateway" NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "transactionId" TEXT,
    "gatewayResponse" JSONB,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notice" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "pdfUrl" TEXT,
    "imageUrl" TEXT,
    "targetAudience" TEXT NOT NULL,
    "targetValue" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "category" TEXT NOT NULL DEFAULT 'GENERAL',
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "createdByRole" "UserRole" NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MealLog" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "breakfast" BOOLEAN NOT NULL DEFAULT false,
    "lunch" BOOLEAN NOT NULL DEFAULT false,
    "dinner" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MealLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GateEntry" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "entryTime" TIMESTAMP(3),
    "exitTime" TIMESTAMP(3),
    "isLateReturn" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GateEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Visitor" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nidNumber" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "relation" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "photo" TEXT,
    "studentId" TEXT NOT NULL,
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "approvedAt" TIMESTAMP(3),
    "entryTime" TIMESTAMP(3) NOT NULL,
    "exitTime" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Visitor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "relatedEntityType" TEXT,
    "relatedEntityId" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "changes" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_universityId_key" ON "User"("universityId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_universityId_idx" ON "User"("universityId");

-- CreateIndex
CREATE INDEX "User_role_accountStatus_idx" ON "User"("role", "accountStatus");

-- CreateIndex
CREATE INDEX "User_currentRoomId_idx" ON "User"("currentRoomId");

-- CreateIndex
CREATE INDEX "User_assignedFloor_idx" ON "User"("assignedFloor");

-- CreateIndex
CREATE INDEX "EmergencyContact_userId_idx" ON "EmergencyContact"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "GuardianInfo_userId_key" ON "GuardianInfo"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Room_roomNumber_key" ON "Room"("roomNumber");

-- CreateIndex
CREATE INDEX "Room_floor_wing_idx" ON "Room"("floor", "wing");

-- CreateIndex
CREATE INDEX "Room_status_idx" ON "Room"("status");

-- CreateIndex
CREATE INDEX "Room_roomType_idx" ON "Room"("roomType");

-- CreateIndex
CREATE INDEX "SeatAllocation_studentId_idx" ON "SeatAllocation"("studentId");

-- CreateIndex
CREATE INDEX "SeatAllocation_roomId_idx" ON "SeatAllocation"("roomId");

-- CreateIndex
CREATE INDEX "SeatAllocation_isActive_idx" ON "SeatAllocation"("isActive");

-- CreateIndex
CREATE INDEX "Application_studentId_idx" ON "Application"("studentId");

-- CreateIndex
CREATE INDEX "Application_type_status_idx" ON "Application"("type", "status");

-- CreateIndex
CREATE INDEX "Application_assignedTo_idx" ON "Application"("assignedTo");

-- CreateIndex
CREATE INDEX "Complaint_studentId_idx" ON "Complaint"("studentId");

-- CreateIndex
CREATE INDEX "Complaint_status_priority_idx" ON "Complaint"("status", "priority");

-- CreateIndex
CREATE INDEX "Complaint_assignedTo_idx" ON "Complaint"("assignedTo");

-- CreateIndex
CREATE INDEX "Bill_studentId_idx" ON "Bill"("studentId");

-- CreateIndex
CREATE INDEX "Bill_status_idx" ON "Bill"("status");

-- CreateIndex
CREATE INDEX "Bill_dueDate_idx" ON "Bill"("dueDate");

-- CreateIndex
CREATE UNIQUE INDEX "Bill_studentId_type_month_year_key" ON "Bill"("studentId", "type", "month", "year");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_transactionId_key" ON "Payment"("transactionId");

-- CreateIndex
CREATE INDEX "Payment_billId_idx" ON "Payment"("billId");

-- CreateIndex
CREATE INDEX "Payment_studentId_idx" ON "Payment"("studentId");

-- CreateIndex
CREATE INDEX "Payment_status_idx" ON "Payment"("status");

-- CreateIndex
CREATE INDEX "Payment_transactionId_idx" ON "Payment"("transactionId");

-- CreateIndex
CREATE INDEX "Notice_isActive_isPublic_idx" ON "Notice"("isActive", "isPublic");

-- CreateIndex
CREATE INDEX "Notice_createdAt_idx" ON "Notice"("createdAt");

-- CreateIndex
CREATE INDEX "MealLog_studentId_idx" ON "MealLog"("studentId");

-- CreateIndex
CREATE INDEX "MealLog_date_idx" ON "MealLog"("date");

-- CreateIndex
CREATE UNIQUE INDEX "MealLog_studentId_date_key" ON "MealLog"("studentId", "date");

-- CreateIndex
CREATE INDEX "GateEntry_studentId_idx" ON "GateEntry"("studentId");

-- CreateIndex
CREATE INDEX "GateEntry_createdAt_idx" ON "GateEntry"("createdAt");

-- CreateIndex
CREATE INDEX "Visitor_studentId_idx" ON "Visitor"("studentId");

-- CreateIndex
CREATE INDEX "Visitor_entryTime_idx" ON "Visitor"("entryTime");

-- CreateIndex
CREATE INDEX "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_entity_entityId_idx" ON "AuditLog"("entity", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_currentRoomId_fkey" FOREIGN KEY ("currentRoomId") REFERENCES "Room"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmergencyContact" ADD CONSTRAINT "EmergencyContact_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuardianInfo" ADD CONSTRAINT "GuardianInfo_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeatAllocation" ADD CONSTRAINT "SeatAllocation_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeatAllocation" ADD CONSTRAINT "SeatAllocation_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bill" ADD CONSTRAINT "Bill_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_billId_fkey" FOREIGN KEY ("billId") REFERENCES "Bill"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MealLog" ADD CONSTRAINT "MealLog_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GateEntry" ADD CONSTRAINT "GateEntry_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Visitor" ADD CONSTRAINT "Visitor_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
