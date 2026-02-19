/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *       description: JWT access token. Expires in 15 minutes.
 *
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           example: "550e8400-e29b-41d4-a716-446655440000"
 *         universityId:
 *           type: string
 *           example: "2020123456"
 *         role:
 *           type: string
 *           enum: [SUPER_ADMIN, PROVOST, HOUSE_TUTOR, ASSISTANT_WARDEN, OFFICE_STAFF, DINING_STAFF, MAINTENANCE_STAFF, GUARD, STUDENT, PARENT]
 *           example: "STUDENT"
 *         name:
 *           type: string
 *           example: "Fatema Ahmed"
 *         email:
 *           type: string
 *           format: email
 *           example: "fatema@uni.edu.bd"
 *         phone:
 *           type: string
 *           example: "01712345678"
 *         photo:
 *           type: string
 *           nullable: true
 *           example: "https://cloudinary.com/photo.jpg"
 *         accountStatus:
 *           type: string
 *           enum: [ACTIVE, SUSPENDED, SEAT_CANCELLED, INACTIVE, GRADUATED]
 *           example: "ACTIVE"
 *         department:
 *           type: string
 *           nullable: true
 *           example: "Computer Science"
 *         year:
 *           type: integer
 *           nullable: true
 *           example: 3
 *         program:
 *           type: string
 *           nullable: true
 *           enum: [UNDERGRADUATE, MASTERS, PHD]
 *           example: "UNDERGRADUATE"
 *         session:
 *           type: string
 *           nullable: true
 *           example: "2020-21"
 *         bloodGroup:
 *           type: string
 *           nullable: true
 *           enum: [A_POSITIVE, A_NEGATIVE, B_POSITIVE, B_NEGATIVE, O_POSITIVE, O_NEGATIVE, AB_POSITIVE, AB_NEGATIVE]
 *           example: "A_POSITIVE"
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     AuthTokens:
 *       type: object
 *       properties:
 *         user:
 *           $ref: '#/components/schemas/User'
 *         accessToken:
 *           type: string
 *           description: JWT access token. Valid for 15 minutes.
 *           example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *
 *     SuccessResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           type: object
 *         message:
 *           type: string
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
 *               example: "Invalid credentials"
 *             code:
 *               type: string
 *               example: "VALIDATION_ERROR"
 *             details:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   field:
 *                     type: string
 *                   message:
 *                     type: string
 *
 *   responses:
 *     Unauthorized:
 *       description: Authentication required or token invalid/expired
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ErrorResponse'
 *           example:
 *             success: false
 *             error:
 *               message: "Authentication token missing or malformed"
 *
 *     Forbidden:
 *       description: Authenticated but insufficient permissions or account not active
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ErrorResponse'
 *           example:
 *             success: false
 *             error:
 *               message: "Your account is not active. Please contact the hall office."
 *
 *     ValidationError:
 *       description: Request body failed validation
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ErrorResponse'
 *           example:
 *             success: false
 *             error:
 *               message: "Validation failed"
 *               code: "VALIDATION_ERROR"
 *               details:
 *                 - field: "body.universityId"
 *                   message: "University ID must have 10 digits"
 *
 *     NotFound:
 *       description: Resource not found
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ErrorResponse'
 *           example:
 *             success: false
 *             error:
 *               message: "Resource not found"
 *
 *     InternalError:
 *       description: Unexpected server error
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ErrorResponse'
 *           example:
 *             success: false
 *             error:
 *               message: "Internal server error"
 */
