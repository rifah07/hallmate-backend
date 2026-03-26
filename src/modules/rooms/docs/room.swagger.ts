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

// ============================================================================
// FILTER ROUTES
// ============================================================================

/**
 * @swagger
 * /api/rooms/floor/{floor}:
 *   get:
 *     tags: [Rooms]
 *     summary: Get rooms by floor
 *     description: |
 *       Returns all rooms on a specific floor.
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
 *         description: Rooms retrieved
 */

/**
 * @swagger
 * /api/rooms/type/{type}:
 *   get:
 *     tags: [Rooms]
 *     summary: Get rooms by type
 *     description: |
 *       Filter rooms by type.
 *
 *       **Access:** SUPER_ADMIN, PROVOST, HOUSE_TUTOR
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Rooms retrieved
 */

// ============================================================================
// COLLECTION ROUTES
// ============================================================================

/**
 * @swagger
 * /api/rooms:
 *   get:
 *     tags: [Rooms]
 *     summary: Get all rooms
 *     description: |
 *       Returns paginated rooms with filtering.
 *
 *       **Access:** SUPER_ADMIN, PROVOST, HOUSE_TUTOR, OFFICE_STAFF
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Rooms retrieved
 *
 *   post:
 *     tags: [Rooms]
 *     summary: Create room
 *     description: |
 *       Creates a new room.
 *
 *       **Access:** SUPER_ADMIN, PROVOST
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateRoomBody'
 *     responses:
 *       201:
 *         description: Room created
 */

// ============================================================================
// SINGLE ROOM ROUTES
// ============================================================================

/**
 * @swagger
 * /api/rooms/{roomId}:
 *   get:
 *     tags: [Rooms]
 *     summary: Get room by ID
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Room retrieved
 *
 *   patch:
 *     tags: [Rooms]
 *     summary: Update room
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Room updated
 *
 *   delete:
 *     tags: [Rooms]
 *     summary: Delete room
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Room deleted
 */

// ============================================================================
// ASSIGNMENT ROUTES
// ============================================================================

/**
 * @swagger
 * /api/rooms/{roomId}/assign:
 *   post:
 *     tags: [Rooms]
 *     summary: Assign student to room
 *     description: |
 *       Assign a student to a specific bed.
 *
 *       **Access:** SUPER_ADMIN, PROVOST, HOUSE_TUTOR
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Student assigned
 */

/**
 * @swagger
 * /api/rooms/{roomId}/unassign/{userId}:
 *   delete:
 *     tags: [Rooms]
 *     summary: Unassign student from room
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Student unassigned
 */

/**
 * @swagger
 * /api/rooms/{roomId}/transfer:
 *   post:
 *     tags: [Rooms]
 *     summary: Transfer student
 *     description: |
 *       Transfer a student to another room.
 *
 *       **Access:** SUPER_ADMIN, PROVOST, HOUSE_TUTOR
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Student transferred
 */
