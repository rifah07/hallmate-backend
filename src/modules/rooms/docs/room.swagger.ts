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
