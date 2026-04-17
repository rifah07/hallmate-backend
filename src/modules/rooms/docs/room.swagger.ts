/**
 * @swagger
 * components:
 *   schemas:
 *     Occupant:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *           example: "Fatema Ahmed"
 *         universityId:
 *           type: string
 *           example: "2020101001"
 *         email:
 *           type: string
 *           format: email
 *           example: "fatema@student.edu.bd"
 *         phone:
 *           type: string
 *           example: "01712345601"
 *         photo:
 *           type: string
 *           nullable: true
 *         bedNumber:
 *           type: integer
 *           minimum: 1
 *           maximum: 4
 *           example: 1
 *         assignedDate:
 *           type: string
 *           format: date-time
 *
 *     Room:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           example: "550e8400-e29b-41d4-a716-446655440000"
 *         roomNumber:
 *           type: string
 *           example: "301"
 *         floor:
 *           type: integer
 *           minimum: 1
 *           maximum: 14
 *           example: 3
 *         wing:
 *           type: string
 *           enum: [A, B]
 *           example: A
 *         roomType:
 *           type: string
 *           enum: [SINGLE, DOUBLE, TRIPLE, FOUR_SHARING]
 *           example: DOUBLE
 *         capacity:
 *           type: integer
 *           minimum: 1
 *           maximum: 4
 *           example: 2
 *         currentOccupancy:
 *           type: integer
 *           example: 1
 *         status:
 *           type: string
 *           enum: [AVAILABLE, OCCUPIED, PARTIALLY_OCCUPIED, MAINTENANCE, RESERVED]
 *           example: PARTIALLY_OCCUPIED
 *         hasAC:
 *           type: boolean
 *           example: true
 *         hasBalcony:
 *           type: boolean
 *           example: false
 *         hasAttachedBath:
 *           type: boolean
 *           example: true
 *         occupants:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Occupant'
 *         vacantBeds:
 *           type: array
 *           items:
 *             type: integer
 *           example: [2]
 *         occupancyRate:
 *           type: number
 *           format: float
 *           example: 50.0
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     CreateRoomInput:
 *       type: object
 *       required:
 *         - roomNumber
 *         - floor
 *         - wing
 *         - roomType
 *         - capacity
 *       properties:
 *         roomNumber:
 *           type: string
 *           pattern: '^[A-Z0-9-]+$'
 *           example: "301"
 *         floor:
 *           type: integer
 *           minimum: 1
 *           maximum: 14
 *           example: 3
 *         wing:
 *           type: string
 *           enum: [A, B]
 *           example: A
 *         roomType:
 *           type: string
 *           enum: [SINGLE, DOUBLE, TRIPLE, FOUR_SHARING]
 *           example: DOUBLE
 *         capacity:
 *           type: integer
 *           minimum: 1
 *           maximum: 4
 *           example: 2
 *         status:
 *           type: string
 *           enum: [AVAILABLE, OCCUPIED, PARTIALLY_OCCUPIED, MAINTENANCE, RESERVED]
 *           default: AVAILABLE
 *         hasAC:
 *           type: boolean
 *           default: false
 *         hasBalcony:
 *           type: boolean
 *           default: false
 *         hasAttachedBath:
 *           type: boolean
 *           default: false
 *
 *     UpdateRoomInput:
 *       type: object
 *       properties:
 *         roomNumber:
 *           type: string
 *           pattern: '^[A-Z0-9-]+$'
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
 *         status:
 *           type: string
 *           enum: [AVAILABLE, OCCUPIED, PARTIALLY_OCCUPIED, MAINTENANCE, RESERVED]
 *         hasAC:
 *           type: boolean
 *         hasBalcony:
 *           type: boolean
 *         hasAttachedBath:
 *           type: boolean
 *
 *     AssignStudentInput:
 *       type: object
 *       required:
 *         - userId
 *         - bedNumber
 *       properties:
 *         userId:
 *           type: string
 *           format: uuid
 *           example: "550e8400-e29b-41d4-a716-446655440001"
 *         bedNumber:
 *           type: integer
 *           minimum: 1
 *           maximum: 4
 *           example: 2
 *         assignedDate:
 *           type: string
 *           format: date-time
 *           description: "Optional - defaults to now"
 *
 *     TransferStudentInput:
 *       type: object
 *       required:
 *         - userId
 *         - targetRoomId
 *         - targetBedNumber
 *       properties:
 *         userId:
 *           type: string
 *           format: uuid
 *         targetRoomId:
 *           type: string
 *           format: uuid
 *         targetBedNumber:
 *           type: integer
 *           minimum: 1
 *           maximum: 4
 *         transferDate:
 *           type: string
 *           format: date-time
 *         reason:
 *           type: string
 *           maxLength: 500
 *
 *     PaginatedRoomsResponse:
 *       type: object
 *       properties:
 *         rooms:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Room'
 *         pagination:
 *           type: object
 *           properties:
 *             page:
 *               type: integer
 *               example: 1
 *             limit:
 *               type: integer
 *               example: 20
 *             total:
 *               type: integer
 *               example: 150
 *             totalPages:
 *               type: integer
 *               example: 8
 *
 *     RoomStatistics:
 *       type: object
 *       properties:
 *         totalRooms:
 *           type: integer
 *           example: 200
 *         occupiedRooms:
 *           type: integer
 *           example: 180
 *         vacantRooms:
 *           type: integer
 *           example: 20
 *         maintenanceRooms:
 *           type: integer
 *           example: 5
 *         totalBeds:
 *           type: integer
 *           example: 500
 *         occupiedBeds:
 *           type: integer
 *           example: 450
 *         vacantBeds:
 *           type: integer
 *           example: 50
 *         overallOccupancyRate:
 *           type: number
 *           format: float
 *           example: 90.0
 *         byFloor:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               floor:
 *                 type: integer
 *               totalRooms:
 *                 type: integer
 *               occupiedRooms:
 *                 type: integer
 *               vacantRooms:
 *                 type: integer
 *               totalBeds:
 *                 type: integer
 *               occupiedBeds:
 *                 type: integer
 *               vacantBeds:
 *                 type: integer
 *               occupancyRate:
 *                 type: number
 *         byType:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [SINGLE, DOUBLE, TRIPLE, FOUR_SHARING]
 *               count:
 *                 type: integer
 *               totalBeds:
 *                 type: integer
 *               occupiedBeds:
 *                 type: integer
 *               vacantBeds:
 *                 type: integer
 *               occupancyRate:
 *                 type: number
 *
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         error:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *             code:
 *               type: string
 */

// ============================================================================
// COLLECTION ROUTES — GET /rooms & POST /rooms
// ============================================================================

/**
 * @swagger
 * /api/rooms:
 *   get:
 *     summary: Get all rooms (with pagination and filters)
 *     description: |
 *       Lists all rooms with pagination and filtering.
 *       - **Super Admin/Provost**: See all rooms
 *       - **House Tutor**: See only their assigned floor
 *       - **Office Staff**: See all rooms (read-only)
 *     tags:
 *       - Rooms - Collection
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *           default: 1
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           default: 20
 *       - name: floor
 *         in: query
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 14
 *       - name: wing
 *         in: query
 *         schema:
 *           type: string
 *           enum: [A, B]
 *       - name: roomType
 *         in: query
 *         schema:
 *           type: string
 *           enum: [SINGLE, DOUBLE, TRIPLE, FOUR_SHARING]
 *       - name: status
 *         in: query
 *         schema:
 *           type: string
 *           enum: [AVAILABLE, OCCUPIED, PARTIALLY_OCCUPIED, MAINTENANCE, RESERVED]
 *       - name: hasVacancy
 *         in: query
 *         schema:
 *           type: boolean
 *       - name: search
 *         in: query
 *         description: Search by room number
 *         schema:
 *           type: string
 *       - name: sortBy
 *         in: query
 *         schema:
 *           type: string
 *           default: roomNumber
 *       - name: sortOrder
 *         in: query
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *     responses:
 *       '200':
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/PaginatedRoomsResponse'
 *       '401':
 *         description: Unauthorized
 *       '403':
 *         description: Forbidden
 *
 *   post:
 *     summary: Create a new room
 *     description: |
 *       Creates a new room.
 *       **Access**: Super Admin, Provost only
 *     tags:
 *       - Rooms - Collection
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateRoomInput'
 *     responses:
 *       '201':
 *         description: Room created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Room'
 *                 message:
 *                   type: string
 *                   example: "Room created successfully"
 *       '400':
 *         description: Validation error
 *       '401':
 *         description: Unauthorized
 *       '403':
 *         description: Forbidden
 *       '409':
 *         description: Room number already exists
 */

// ============================================================================
// STATISTICS — GET /rooms/statistics
// ============================================================================

/**
 * @swagger
 * /api/rooms/statistics:
 *   get:
 *     summary: Get room statistics
 *     description: |
 *       Returns comprehensive room statistics.
 *       - **House Tutor**: Statistics for their assigned floor only
 *       - **Super Admin/Provost**: Statistics for all floors
 *     tags:
 *       - Rooms - Statistics
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       '200':
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/RoomStatistics'
 */

// ============================================================================
// VACANCY ROUTES
// ============================================================================

/**
 * @swagger
 * /api/rooms/vacant:
 *   get:
 *     summary: Get all vacant rooms
 *     description: |
 *       Returns rooms with at least one vacant bed.
 *       - **House Tutor**: Only vacant rooms on their floor
 *       - **Super Admin/Provost**: All vacant rooms (can filter by floor)
 *     tags:
 *       - Rooms - Vacancy
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: floor
 *         in: query
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 14
 *     responses:
 *       '200':
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
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
 *     description: Vacant rooms filtered by floor
 *     tags:
 *       - Rooms - Vacancy
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: floor
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 14
 *     responses:
 *       '200':
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     rooms:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Room'
 *                     count:
 *                       type: integer
 *                     floor:
 *                       type: integer
 */

/**
 * @swagger
 * /api/rooms/my-floor:
 *   get:
 *     summary: Get rooms on my floor (House Tutor only)
 *     description: |
 *       Returns all rooms on the house tutor's assigned floor.
 *       **Access**: House Tutor only
 *     tags:
 *       - Rooms - Vacancy
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       '200':
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     rooms:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Room'
 *                     count:
 *                       type: integer
 *                     floor:
 *                       type: integer
 *       '403':
 *         description: Not a House Tutor or no assigned floor
 */

// ============================================================================
// FILTER ROUTES
// ============================================================================

/**
 * @swagger
 * /api/rooms/floor/{floor}:
 *   get:
 *     summary: Get rooms by floor
 *     description: |
 *       Returns all rooms on specific floor.
 *       - **House Tutor**: Can only access their assigned floor
 *     tags:
 *       - Rooms - Filters
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: floor
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 14
 *     responses:
 *       '200':
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     rooms:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Room'
 *                     count:
 *                       type: integer
 *                     floor:
 *                       type: integer
 */

/**
 * @swagger
 * /api/rooms/type/{type}:
 *   get:
 *     summary: Get rooms by type
 *     description: Filter rooms by type (SINGLE, DOUBLE, TRIPLE, FOUR_SHARING)
 *     tags:
 *       - Rooms - Filters
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: type
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           enum: [SINGLE, DOUBLE, TRIPLE, FOUR_SHARING]
 *     responses:
 *       '200':
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     rooms:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Room'
 *                     count:
 *                       type: integer
 *                     roomType:
 *                       type: string
 */

// ============================================================================
// SINGLE ROOM ROUTES — GET/PATCH/DELETE /rooms/:roomId
// ============================================================================

/**
 * @swagger
 * /api/rooms/{roomId}:
 *   get:
 *     summary: Get room by ID
 *     description: |
 *       Get detailed room information including occupants and vacant beds.
 *       - **House Tutor**: Can only access rooms on their floor
 *     tags:
 *       - Rooms - Collection
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: roomId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       '200':
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Room'
 *       '403':
 *         description: Access denied (wrong floor for House Tutor)
 *       '404':
 *         description: Room not found
 *
 *   patch:
 *     summary: Update room
 *     description: |
 *       Update room details.
 *       **Access**: Super Admin, Provost only
 *     tags:
 *       - Rooms - Collection
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: roomId
 *         in: path
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
 *       '200':
 *         description: Room updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Room'
 *                 message:
 *                   type: string
 *       '400':
 *         description: Validation error or cannot reduce capacity
 *       '404':
 *         description: Room not found
 *       '409':
 *         description: Room number already exists
 *
 *   delete:
 *     summary: Delete room
 *     description: |
 *       Delete a room. Cannot delete if room has occupants.
 *       **Access**: Super Admin, Provost only
 *     tags:
 *       - Rooms - Collection
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: roomId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       '200':
 *         description: Room deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       '400':
 *         description: Cannot delete room with occupants
 *       '404':
 *         description: Room not found
 */

// ============================================================================
// ASSIGNMENT ROUTES
// ============================================================================

/**
 * @swagger
 * /api/rooms/{roomId}/assign:
 *   post:
 *     summary: Assign student to room
 *     description: |
 *       Assign a student to a specific bed in a room.
 *       **Access**: Super Admin, Provost, House Tutor (own floor only)
 *
 *       **Validations:**
 *       - Room must be AVAILABLE
 *       - Bed number must be valid (1-4)
 *       - Bed must not be occupied
 *       - Student must not be in another room
 *       - Room must not be full
 *     tags:
 *       - Rooms - Assignments
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: roomId
 *         in: path
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
 *           example:
 *             userId: "550e8400-e29b-41d4-a716-446655440001"
 *             bedNumber: 2
 *             assignedDate: "2026-03-15T10:00:00Z"
 *     responses:
 *       '200':
 *         description: Student assigned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Room'
 *                 message:
 *                   type: string
 *                   example: "Student assigned successfully"
 *       '400':
 *         description: Validation error (room full, bed occupied, etc.)
 *       '404':
 *         description: Room not found
 *       '409':
 *         description: Student already assigned to a room
 */

/**
 * @swagger
 * /api/rooms/{roomId}/unassign/{userId}:
 *   delete:
 *     summary: Unassign student from room
 *     description: |
 *       Remove a student from their room.
 *       **Access**: Super Admin, Provost, House Tutor (own floor only)
 *     tags:
 *       - Rooms - Assignments
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: roomId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - name: userId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       '200':
 *         description: Student unassigned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Room'
 *                 message:
 *                   type: string
 *       '404':
 *         description: Room or student assignment not found
 */

/**
 * @swagger
 * /api/rooms/{roomId}/transfer:
 *   post:
 *     summary: Transfer student to another room
 *     description: |
 *       Transfer a student from one room to another.
 *       **Access**: Super Admin, Provost, House Tutor (own floor only)
 *
 *       **Validations:**
 *       - Student must be in source room
 *       - Target room must be AVAILABLE
 *       - Target bed must be vacant
 *       - Target room must not be full
 *       - House Tutor can only transfer within their floor
 *     tags:
 *       - Rooms - Assignments
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: roomId
 *         in: path
 *         required: true
 *         description: Source room ID
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TransferStudentInput'
 *           example:
 *             userId: "550e8400-e29b-41d4-a716-446655440001"
 *             targetRoomId: "550e8400-e29b-41d4-a716-446655440002"
 *             targetBedNumber: 3
 *             transferDate: "2026-03-15T10:00:00Z"
 *             reason: "Requested roommate change"
 *     responses:
 *       '200':
 *         description: Student transferred successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Room'
 *                   description: Target room details
 *                 message:
 *                   type: string
 *       '400':
 *         description: Validation error
 *       '404':
 *         description: Room or student not found
 *       '409':
 *         description: Target bed already occupied
 */
