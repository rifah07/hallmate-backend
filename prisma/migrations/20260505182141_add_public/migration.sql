-- CreateEnum
CREATE TYPE "NoticePriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "PublicApplicationType" AS ENUM ('SEAT_REQUEST', 'INFORMATION_REQUEST', 'GENERAL_INQUIRY', 'ADMISSION_QUERY');

-- CreateEnum
CREATE TYPE "GalleryCategory" AS ENUM ('INFRASTRUCTURE', 'EVENTS', 'SPORTS', 'CULTURAL', 'ACADEMICS', 'DINING', 'GENERAL');

-- CreateEnum
CREATE TYPE "FacilityCategory" AS ENUM ('ACCOMMODATION', 'DINING', 'SPORTS', 'ACADEMIC', 'HEALTH', 'RECREATION', 'UTILITIES');

-- CreateEnum
CREATE TYPE "StaffCategory" AS ENUM ('ADMINISTRATIVE', 'ACADEMIC', 'SUPPORT', 'SECURITY', 'DINING', 'MAINTENANCE');

-- CreateTable
CREATE TABLE "HallInfo" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "established" INTEGER NOT NULL,
    "location" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "vision" TEXT,
    "mission" TEXT,
    "capacity" INTEGER NOT NULL,
    "totalRooms" INTEGER NOT NULL,
    "logoUrl" TEXT,
    "coverUrl" TEXT,
    "mapEmbedUrl" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "socialLinks" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HallInfo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PublicPageContent" (
    "id" TEXT NOT NULL,
    "page" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PublicPageContent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Facility" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "category" "FacilityCategory" NOT NULL,
    "description" TEXT NOT NULL,
    "iconUrl" TEXT,
    "imageUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Facility_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FAQ" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'GENERAL',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FAQ_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GalleryItem" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "category" "GalleryCategory" NOT NULL DEFAULT 'GENERAL',
    "tags" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "capturedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GalleryItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PublicNotice" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "summary" TEXT,
    "pdfUrl" TEXT,
    "imageUrl" TEXT,
    "priority" "NoticePriority" NOT NULL DEFAULT 'NORMAL',
    "category" TEXT NOT NULL DEFAULT 'GENERAL',
    "tags" TEXT[],
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "views" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PublicNotice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PublicEvent" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "summary" TEXT,
    "venue" TEXT,
    "imageUrl" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "isAllDay" BOOLEAN NOT NULL DEFAULT false,
    "tags" TEXT[],
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PublicEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Achievement" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'GENERAL',
    "imageUrl" TEXT,
    "year" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Achievement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffProfile" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "designation" TEXT NOT NULL,
    "category" "StaffCategory" NOT NULL,
    "department" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "photoUrl" TEXT,
    "bio" TEXT,
    "qualifications" TEXT,
    "joiningDate" TIMESTAMP(3),
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StaffProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HouseTutorProfile" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "designation" TEXT NOT NULL DEFAULT 'House Tutor',
    "department" TEXT NOT NULL,
    "floor" INTEGER,
    "wing" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "photoUrl" TEXT,
    "bio" TEXT,
    "officeHours" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HouseTutorProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiningInfo" (
    "id" TEXT NOT NULL,
    "mealPlan" JSONB NOT NULL,
    "weeklyMenu" JSONB,
    "specialDiets" TEXT[],
    "capacity" INTEGER,
    "location" TEXT,
    "imageUrl" TEXT,
    "contactPhone" TEXT,
    "notice" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiningInfo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdmissionInfo" (
    "id" TEXT NOT NULL,
    "session" TEXT NOT NULL,
    "eligibility" TEXT NOT NULL,
    "process" TEXT NOT NULL,
    "requiredDocs" TEXT[],
    "importantDates" JSONB,
    "seatCapacity" INTEGER,
    "applicationFee" DOUBLE PRECISION,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "faqItems" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdmissionInfo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactSubmission" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "repliedAt" TIMESTAMP(3),
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContactSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PublicApplication" (
    "id" TEXT NOT NULL,
    "type" "PublicApplicationType" NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "applicantName" TEXT NOT NULL,
    "applicantEmail" TEXT NOT NULL,
    "applicantPhone" TEXT NOT NULL,
    "studentId" TEXT,
    "program" TEXT,
    "department" TEXT,
    "session" TEXT,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "attachments" TEXT[],
    "responseNote" TEXT,
    "respondedAt" TIMESTAMP(3),
    "assignedTo" TEXT,
    "internalNote" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PublicApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProvostHistory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "photoUrl" TEXT,
    "photoPublicId" TEXT,
    "designation" TEXT NOT NULL DEFAULT 'Provost',
    "department" TEXT,
    "tenureStart" TIMESTAMP(3) NOT NULL,
    "tenureEnd" TIMESTAMP(3),
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    "bio" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProvostHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PublicPageContent_page_key" ON "PublicPageContent"("page");

-- CreateIndex
CREATE INDEX "PublicPageContent_page_idx" ON "PublicPageContent"("page");

-- CreateIndex
CREATE UNIQUE INDEX "Facility_slug_key" ON "Facility"("slug");

-- CreateIndex
CREATE INDEX "Facility_category_idx" ON "Facility"("category");

-- CreateIndex
CREATE INDEX "Facility_slug_idx" ON "Facility"("slug");

-- CreateIndex
CREATE INDEX "FAQ_category_isActive_idx" ON "FAQ"("category", "isActive");

-- CreateIndex
CREATE INDEX "GalleryItem_category_isActive_idx" ON "GalleryItem"("category", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "PublicNotice_slug_key" ON "PublicNotice"("slug");

-- CreateIndex
CREATE INDEX "PublicNotice_slug_idx" ON "PublicNotice"("slug");

-- CreateIndex
CREATE INDEX "PublicNotice_isPublished_expiresAt_idx" ON "PublicNotice"("isPublished", "expiresAt");

-- CreateIndex
CREATE INDEX "PublicNotice_category_idx" ON "PublicNotice"("category");

-- CreateIndex
CREATE INDEX "PublicNotice_createdAt_idx" ON "PublicNotice"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PublicEvent_slug_key" ON "PublicEvent"("slug");

-- CreateIndex
CREATE INDEX "PublicEvent_slug_idx" ON "PublicEvent"("slug");

-- CreateIndex
CREATE INDEX "PublicEvent_isPublished_startDate_idx" ON "PublicEvent"("isPublished", "startDate");

-- CreateIndex
CREATE INDEX "PublicEvent_isFeatured_idx" ON "PublicEvent"("isFeatured");

-- CreateIndex
CREATE INDEX "Achievement_year_isActive_idx" ON "Achievement"("year", "isActive");

-- CreateIndex
CREATE INDEX "Achievement_category_idx" ON "Achievement"("category");

-- CreateIndex
CREATE INDEX "StaffProfile_category_isPublic_idx" ON "StaffProfile"("category", "isPublic");

-- CreateIndex
CREATE INDEX "HouseTutorProfile_isActive_idx" ON "HouseTutorProfile"("isActive");

-- CreateIndex
CREATE INDEX "HouseTutorProfile_floor_idx" ON "HouseTutorProfile"("floor");

-- CreateIndex
CREATE INDEX "AdmissionInfo_isCurrent_isActive_idx" ON "AdmissionInfo"("isCurrent", "isActive");

-- CreateIndex
CREATE INDEX "ContactSubmission_isRead_idx" ON "ContactSubmission"("isRead");

-- CreateIndex
CREATE INDEX "ContactSubmission_createdAt_idx" ON "ContactSubmission"("createdAt");

-- CreateIndex
CREATE INDEX "PublicApplication_type_status_idx" ON "PublicApplication"("type", "status");

-- CreateIndex
CREATE INDEX "PublicApplication_applicantEmail_idx" ON "PublicApplication"("applicantEmail");

-- CreateIndex
CREATE INDEX "PublicApplication_createdAt_idx" ON "PublicApplication"("createdAt");

-- CreateIndex
CREATE INDEX "ProvostHistory_isCurrent_idx" ON "ProvostHistory"("isCurrent");

-- CreateIndex
CREATE INDEX "ProvostHistory_tenureStart_idx" ON "ProvostHistory"("tenureStart");

-- CreateIndex
CREATE INDEX "ProvostHistory_userId_idx" ON "ProvostHistory"("userId");

-- AddForeignKey
ALTER TABLE "ProvostHistory" ADD CONSTRAINT "ProvostHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
