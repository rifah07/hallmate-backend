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

/**
 * @swagger
 * tags:
 *   - name: Authentication
 *     description: Login, logout, token management
 *   - name: Password
 *     description: Password reset and change flows
 *   - name: Profile
 *     description: User profile access
 */

// ============================================================================
// AUTH ROUTES
// ============================================================================

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags: [Authentication]
 *     summary: Login with university ID and password
 *     description: |
 *       Standard login for all users. Returns an access token (15min) and sets
 *       a httpOnly refresh token cookie (7 days).
 *
 *       **Note:** First-time users must use `/api/auth/first-time-login` instead.
 *       Their account will have `isFirstLogin: true` and they must use their OTP.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [universityId, password]
 *             properties:
 *               universityId:
 *                 type: string
 *                 pattern: '^\d{10}$'
 *                 example: "2020123456"
 *                 description: 10-digit university ID
 *               password:
 *                 type: string
 *                 example: "MyPass@123"
 *     responses:
 *       200:
 *         description: Login successful
 *         headers:
 *           Set-Cookie:
 *             description: httpOnly refresh token cookie (7 days)
 *             schema:
 *               type: string
 *               example: "refreshToken=eyJ...; HttpOnly; SameSite=Strict; Max-Age=604800"
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/AuthTokens'
 *                     message:
 *                       example: "Login successful"
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         description: Invalid credentials or first-time login required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               invalidCredentials:
 *                 summary: Wrong password or university ID
 *                 value:
 *                   success: false
 *                   error:
 *                     message: "Invalid credentials"
 *               firstTimeLogin:
 *                 summary: First-time login required
 *                 value:
 *                   success: false
 *                   error:
 *                     message: "First-time login required. Please use your one-time password."
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */

/**
 * @swagger
 * /api/auth/first-time-login:
 *   post:
 *     tags: [Authentication]
 *     summary: First-time login with OTP to set permanent password
 *     description: |
 *       Used when a student logs in for the first time. The administrator provides
 *       a one-time password (OTP) which the student uses to set their permanent password.
 *
 *       After this is completed, the student must use `/api/auth/login` for subsequent logins.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [universityId, oneTimePassword, newPassword, confirmPassword]
 *             properties:
 *               universityId:
 *                 type: string
 *                 pattern: '^\d{10}$'
 *                 example: "2020123456"
 *               oneTimePassword:
 *                 type: string
 *                 example: "Ab3Xy9Qz"
 *                 description: OTP provided by administrator
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *                 example: "MyNewPass@123"
 *                 description: |
 *                   Must contain: uppercase, lowercase, number, special character (@$!%*?&)
 *               confirmPassword:
 *                 type: string
 *                 example: "MyNewPass@123"
 *     responses:
 *       200:
 *         description: Password set successfully
 *         headers:
 *           Set-Cookie:
 *             description: httpOnly refresh token cookie (7 days)
 *             schema:
 *               type: string
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/AuthTokens'
 *                     message:
 *                       example: "Password set successfully. Welcome!"
 *       400:
 *         description: Validation error or first-time login already completed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               alreadyCompleted:
 *                 summary: First-time login already done
 *                 value:
 *                   success: false
 *                   error:
 *                     message: "First-time login already completed. Use regular login."
 *               otpExpired:
 *                 summary: OTP expired
 *                 value:
 *                   success: false
 *                   error:
 *                     message: "OTP has expired. Contact administrator."
 *               passwordMismatch:
 *                 summary: Passwords do not match
 *                 value:
 *                   success: false
 *                   error:
 *                     message: "Validation failed"
 *                     code: "VALIDATION_ERROR"
 *                     details:
 *                       - field: "body.confirmPassword"
 *                         message: "Password do not match"
 *       401:
 *         description: Invalid OTP
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               error:
 *                 message: "Invalid OTP"
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     tags: [Authentication]
 *     summary: Logout and revoke refresh token
 *     description: |
 *       Revokes the refresh token stored in the cookie and clears it.
 *       The access token remains valid until it expires (15 minutes) —
 *       this is expected behavior for stateless JWTs.
 *
 *       Requires authentication via Bearer token.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     message:
 *                       example: "Logged out successfully"
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */

/**
 * @swagger
 * /api/auth/refresh-token:
 *   post:
 *     tags: [Authentication]
 *     summary: Refresh access token using refresh token cookie
 *     description: |
 *       Uses the httpOnly `refreshToken` cookie to issue a new access token and
 *       rotate the refresh token (token rotation pattern).
 *
 *       **Token Rotation:** Each call invalidates the old refresh token and issues a new one.
 *
 *       **Reuse Detection:** If an already-used refresh token is presented, ALL tokens
 *       for that user are immediately revoked — forcing a full re-login. This protects
 *       against token theft.
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *         headers:
 *           Set-Cookie:
 *             description: New httpOnly refresh token cookie (7 days)
 *             schema:
 *               type: string
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         accessToken:
 *                           type: string
 *                           example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                     message:
 *                       example: "Token refreshed successfully"
 *       401:
 *         description: Refresh token missing, invalid, expired, or reuse detected
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               missing:
 *                 summary: No cookie sent
 *                 value:
 *                   success: false
 *                   error:
 *                     message: "Refresh token missing"
 *               invalid:
 *                 summary: Token not found in DB
 *                 value:
 *                   success: false
 *                   error:
 *                     message: "Invalid refresh token"
 *               expired:
 *                 summary: Token expired
 *                 value:
 *                   success: false
 *                   error:
 *                     message: "Refresh token expired. Please log in again."
 *               reuse:
 *                 summary: Reuse detected — all tokens revoked
 *                 value:
 *                   success: false
 *                   error:
 *                     message: "Refresh token reuse detected. Please log in again."
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
