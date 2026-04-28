-- CreateTable
CREATE TABLE "meal_cancellations" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "breakfast" BOOLEAN NOT NULL DEFAULT false,
    "lunch" BOOLEAN NOT NULL DEFAULT false,
    "dinner" BOOLEAN NOT NULL DEFAULT false,
    "reason" TEXT,
    "cancelledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "meal_cancellations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meal_settings" (
    "id" TEXT NOT NULL,
    "cancellationDeadlineHours" INTEGER NOT NULL DEFAULT 24,
    "allowPastCancellation" BOOLEAN NOT NULL DEFAULT false,
    "requireReason" BOOLEAN NOT NULL DEFAULT false,
    "maxCancellationDays" INTEGER NOT NULL DEFAULT 30,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meal_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "meal_cancellations_studentId_idx" ON "meal_cancellations"("studentId");

-- CreateIndex
CREATE INDEX "meal_cancellations_date_idx" ON "meal_cancellations"("date");

-- CreateIndex
CREATE UNIQUE INDEX "meal_cancellations_studentId_date_key" ON "meal_cancellations"("studentId", "date");

-- AddForeignKey
ALTER TABLE "meal_cancellations" ADD CONSTRAINT "meal_cancellations_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
