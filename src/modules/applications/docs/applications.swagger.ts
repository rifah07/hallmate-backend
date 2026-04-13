/**
 * @swagger
 * components:
 *   schemas:
 *     Application:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         type:
 *           type: string
 *           enum: [SEAT_APPLICATION, SEAT_CANCELLATION, SEAT_TRANSFER, SEAT_SWAP, LEAVE, COMPLAINT, MAINTENANCE]
 *         status:
 *           type: string
 *           enum: [PENDING, APPROVED, REJECTED, CANCELLED]
 *         studentId:
 *           type: string
 *           format: uuid
 *         data:
 *           type: object
 *         attachments:
 *           type: array
 *           items:
 *             type: string
 *             format: uri
 *         assignedTo:
 *           type: string
 *           format: uuid
 *         assignedToRole:
 *           type: string
 *           enum: [SUPER_ADMIN, PROVOST, HOUSE_TUTOR, OFFICE_STAFF, ASSISTANT_WARDEN]
 *         responseNote:
 *           type: string
 *         respondedAt:
 *           type: string
 *           format: date-time
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     CreateApplicationInput:
 *       type: object
 *       required: [type, data]
 *       properties:
 *         type:
 *           type: string
 *           enum: [SEAT_APPLICATION, SEAT_CANCELLATION, SEAT_TRANSFER, SEAT_SWAP, LEAVE, COMPLAINT, MAINTENANCE]
 *         data:
 *           type: object
 *         attachments:
 *           type: array
 *           items:
 *             type: string
 *             format: uri
 *
 *     UpdateApplicationInput:
 *       type: object
 *       description: At least one field required
 *       properties:
 *         data:
 *           type: object
 *         attachments:
 *           type: array
 *           items:
 *             type: string
 *             format: uri
 *
 *     AssignApplicationInput:
 *       type: object
 *       required: [assignedTo, assignedToRole]
 *       properties:
 *         assignedTo:
 *           type: string
 *           format: uuid
 *         assignedToRole:
 *           type: string
 *           enum: [SUPER_ADMIN, PROVOST, HOUSE_TUTOR, OFFICE_STAFF, ASSISTANT_WARDEN]
 *
 *     RespondToApplicationInput:
 *       type: object
 *       required: [status, responseNote]
 *       properties:
 *         status:
 *           type: string
 *           enum: [APPROVED, REJECTED, CANCELLED]
 *         responseNote:
 *           type: string
 *
 *     ApplicationStatistics:
 *       type: object
 *       properties:
 *         total:
 *           type: integer
 *         pending:
 *           type: integer
 *         approved:
 *           type: integer
 *         rejected:
 *           type: integer
 *         cancelled:
 *           type: integer
 */
