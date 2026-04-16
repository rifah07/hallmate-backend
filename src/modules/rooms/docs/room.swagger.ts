/**
 * @swagger
 * tags:
 *   - name: Rooms - Collection
 *   - name: Rooms - Vacancy
 *   - name: Rooms - Filters
 *   - name: Rooms - Assignments
 *   - name: Rooms - Statistics
 */

// ============================================================================
// COLLECTION
// ============================================================================

/**
 * @swagger
 * /api/rooms:
 *   get:
 *     summary: Get all rooms (with pagination and filters)
 *     description: |
 *       Lists all rooms with pagination and filtering.
 *       - Super Admin/Provost: See all rooms
 *       - House Tutor: See only their assigned floor
 *       - Office Staff: Read-only access
 *     tags: [Rooms - Collection]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: floor
 *         schema: { type: integer, minimum: 1, maximum: 14 }
 *       - in: query
 *         name: wing
 *         schema:
 *           type: string
 *           enum: [A, B]
 *       - in: query
 *         name: roomType
 *         schema:
 *           type: string
 *           enum: [SINGLE, DOUBLE, TRIPLE, FOUR_SHARING]
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [AVAILABLE, OCCUPIED, PARTIALLY_OCCUPIED, MAINTENANCE, RESERVED]
 *       - in: query
 *         name: hasVacancy
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: roomNumber
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/PaginatedRoomsResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *
 *   post:
 *     summary: Create a new room
 *     tags: [Rooms - Collection]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateRoomInput'
 *     responses:
 *       201:
 *         description: Room created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   $ref: '#/components/schemas/Room'
 *                 message:
 *                   type: string
 *       400:
 *         description: Validation error
 *       409:
 *         description: Room number already exists
 */

// ============================================================================
// STATISTICS
// ============================================================================

/**
 * @swagger
 * /api/rooms/statistics:
 *   get:
 *     summary: Get room statistics
 *     tags: [Rooms - Statistics]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   $ref: '#/components/schemas/RoomStatistics'
 */

// ============================================================================
// VACANCY
// ============================================================================

/**
 * @swagger
 * /api/rooms/vacant:
 *   get:
 *     summary: Get all vacant rooms
 *     tags: [Rooms - Vacancy]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: floor
 *         schema: { type: integer, minimum: 1, maximum: 14 }
 *     responses:
 *       200:
 *         description: Vacant rooms
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     rooms:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Room'
 *                     count:
 *                       type: integer
 */

/**
 * @swagger
 * /api/rooms/vacant/floor/{floor}:
 *   get:
 *     summary: Get vacant rooms on specific floor
 *     tags: [Rooms - Vacancy]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: floor
 *         required: true
 *         schema: { type: integer, minimum: 1, maximum: 14 }
 *     responses:
 *       200:
 *         description: Vacant rooms by floor
 */

/**
 * @swagger
 * /api/rooms/my-floor:
 *   get:
 *     summary: Get rooms on my floor
 *     tags: [Rooms - Vacancy]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Rooms retrieved
 *       403:
 *         description: Not a House Tutor
 */

// ============================================================================
// FILTERS
// ============================================================================

/**
 * @swagger
 * /api/rooms/floor/{floor}:
 *   get:
 *     summary: Get rooms by floor
 *     tags: [Rooms - Filters]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: floor
 *         required: true
 *         schema: { type: integer, minimum: 1, maximum: 14 }
 *     responses:
 *       200:
 *         description: Rooms retrieved
 */

/**
 * @swagger
 * /api/rooms/type/{type}:
 *   get:
 *     summary: Get rooms by type
 *     tags: [Rooms - Filters]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [SINGLE, DOUBLE, TRIPLE, FOUR_SHARING]
 *     responses:
 *       200:
 *         description: Rooms retrieved
 */

// ============================================================================
// SINGLE ROOM
// ============================================================================

/**
 * @swagger
 * /api/rooms/{roomId}:
 *   get:
 *     summary: Get room by ID
 *     tags: [Rooms - Collection]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Room retrieved
 *       404:
 *         description: Room not found
 *
 *   patch:
 *     summary: Update room
 *     tags: [Rooms - Collection]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateRoomInput'
 *     responses:
 *       200:
 *         description: Room updated
 *       400:
 *         description: Validation error
 *
 *   delete:
 *     summary: Delete room
 *     tags: [Rooms - Collection]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Room deleted
 */

// ============================================================================
// ASSIGNMENTS
// ============================================================================

/**
 * @swagger
 * /api/rooms/{roomId}/assign:
 *   post:
 *     summary: Assign student to room
 *     tags: [Rooms - Assignments]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AssignStudentInput'
 *     responses:
 *       200:
 *         description: Student assigned
 *       400:
 *         description: Validation error
 *       409:
 *         description: Conflict
 */

/**
 * @swagger
 * /api/rooms/{roomId}/unassign/{userId}:
 *   delete:
 *     summary: Unassign student
 *     tags: [Rooms - Assignments]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Student unassigned
 *       404:
 *         description: Not found
 */

/**
 * @swagger
 * /api/rooms/{roomId}/transfer:
 *   post:
 *     summary: Transfer student
 *     tags: [Rooms - Assignments]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TransferStudentInput'
 *     responses:
 *       200:
 *         description: Student transferred
 *       400:
 *         description: Validation error
 *       409:
 *         description: Conflict
 */
