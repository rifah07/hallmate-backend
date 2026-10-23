-- Room assignment used to write only room_occupants, never User.currentRoomId,
-- yet floor rules read currentRoomId. Make it match the occupant rows.
UPDATE "User" AS u
SET "currentRoomId" = o."roomId"
FROM "room_occupants" AS o
WHERE o."userId" = u."id" AND u."currentRoomId" IS DISTINCT FROM o."roomId";

UPDATE "User"
SET "currentRoomId" = NULL
WHERE "currentRoomId" IS NOT NULL
  AND "id" NOT IN (SELECT "userId" FROM "room_occupants");
