/**
 * @swagger
 * components:
 *   schemas:
 *     Room:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         roomNumber:
 *           type: string
 *           example: "301"
 *         floor:
 *           type: integer
 *           example: 3
 *         wing:
 *           type: string
 *           enum: [A, B]
 *         roomType:
 *           type: string
 *           enum: [SINGLE, DOUBLE, TRIPLE, FOUR_SHARING]
 *         capacity:
 *           type: integer
 *         currentOccupancy:
 *           type: integer
 *         status:
 *           type: string
 *           enum: [AVAILABLE, OCCUPIED, PARTIALLY_OCCUPIED, MAINTENANCE, RESERVED]
 *         hasAC:
 *           type: boolean
 *         hasBalcony:
 *           type: boolean
 *         hasAttachedBath:
 *           type: boolean
 *         vacantBeds:
 *           type: array
 *           items:
 *             type: integer
 *         occupancyRate:
 *           type: number
 *
 *     CreateRoomBody:
 *       type: object
 *       required: [roomNumber, floor, wing, roomType, capacity]
 *       properties:
 *         roomNumber:
 *           type: string
 *           example: "301"
 *         floor:
 *           type: integer
 *           minimum: 1
 *           maximum: 14
 *         wing:
 *           type: string
 *           enum: [A, B]
 *         roomType:
 *           type: string
 *           enum: [SINGLE, DOUBLE, TRIPLE, FOUR_SHARING]
 *         capacity:
 *           type: integer
 *           minimum: 1
 *           maximum: 4
 *         hasAC:
 *           type: boolean
 *         hasBalcony:
 *           type: boolean
 *         hasAttachedBath:
 *           type: boolean
 *
 *     UpdateRoomBody:
 *       type: object
 *       description: At least one field required
 *       properties:
 *         roomNumber:
 *           type: string
 *         floor:
 *           type: integer
 *         wing:
 *           type: string
 *         roomType:
 *           type: string
 *         capacity:
 *           type: integer
 *         status:
 *           type: string
 *         hasAC:
 *           type: boolean
 *         hasBalcony:
 *           type: boolean
 *         hasAttachedBath:
 *           type: boolean
 *
 *     AssignStudentBody:
 *       type: object
 *       required: [userId, bedNumber]
 *       properties:
 *         userId:
 *           type: string
 *           format: uuid
 *         bedNumber:
 *           type: integer
 *           minimum: 1
 *           maximum: 4
 *
 *     TransferStudentBody:
 *       type: object
 *       required: [userId, targetRoomId, targetBedNumber]
 *       properties:
 *         userId:
 *           type: string
 *           format: uuid
 *         targetRoomId:
 *           type: string
 *           format: uuid
 *         targetBedNumber:
 *           type: integer
 *
 *     RoomStatistics:
 *       type: object
 *       properties:
 *         totalRooms:
 *           type: integer
 *         occupiedRooms:
 *           type: integer
 *         vacantRooms:
 *           type: integer
 *         totalBeds:
 *           type: integer
 *         occupiedBeds:
 *           type: integer
 *         vacantBeds:
 *           type: integer
 *         overallOccupancyRate:
 *           type: number
 */

/**
 * @swagger
 * tags:
 *   - name: Rooms
 *     description: Room management, allocation, and vacancy tracking
 */

// ============================================================================
// STATISTICS
// ============================================================================

/**
 * @swagger
 * /api/rooms/statistics:
 *   get:
 *     tags: [Rooms]
 *     summary: Get room statistics
 *     description: |
 *       Returns aggregated statistics about rooms and beds.
 *
 *       **Access:** SUPER_ADMIN, PROVOST, HOUSE_TUTOR
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 */

// ============================================================================
// VACANCY ROUTES
// ============================================================================

/**
 * @swagger
 * /api/rooms/vacant:
 *   get:
 *     tags: [Rooms]
 *     summary: Get all vacant rooms
 *     description: |
 *       Returns rooms that have at least one vacant bed.
 *
 *       **Access:** SUPER_ADMIN, PROVOST, HOUSE_TUTOR
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Vacant rooms retrieved
 */

/**
 * @swagger
 * /api/rooms/vacant/floor/{floor}:
 *   get:
 *     tags: [Rooms]
 *     summary: Get vacant rooms by floor
 *     description: |
 *       Returns vacant rooms filtered by floor.
 *
 *       **Access:** SUPER_ADMIN, PROVOST, HOUSE_TUTOR
 *     parameters:
 *       - in: path
 *         name: floor
 *         required: true
 *         schema:
 *           type: integer
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Vacant rooms by floor retrieved
 */

/**
 * @swagger
 * /api/rooms/my-floor:
 *   get:
 *     tags: [Rooms]
 *     summary: Get my floor rooms
 *     description: |
 *       Returns rooms for the authenticated house tutor's floor.
 *
 *       **Access:** HOUSE_TUTOR
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Rooms retrieved
 */
