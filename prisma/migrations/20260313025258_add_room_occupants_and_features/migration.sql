-- AlterTable
ALTER TABLE "Room" ADD COLUMN     "hasAC" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "hasAttachedBath" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "hasBalcony" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "room_occupants" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bedNumber" INTEGER NOT NULL,
    "assignedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "room_occupants_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "room_occupants_roomId_idx" ON "room_occupants"("roomId");

-- CreateIndex
CREATE INDEX "room_occupants_userId_idx" ON "room_occupants"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "room_occupants_roomId_bedNumber_key" ON "room_occupants"("roomId", "bedNumber");

-- AddForeignKey
ALTER TABLE "room_occupants" ADD CONSTRAINT "room_occupants_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_occupants" ADD CONSTRAINT "room_occupants_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
