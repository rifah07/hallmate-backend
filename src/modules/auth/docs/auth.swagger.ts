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

// ============================================================================
// PASSWORD ROUTES
// ============================================================================

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     tags: [Password]
 *     summary: Request a password reset OTP via email
 *     description: |
 *       Sends a 6-digit OTP to the user's registered email address.
 *       OTP expires in 15 minutes.
 *
 *       **Security:** Always returns the same success response regardless of
 *       whether the university ID exists — prevents user enumeration attacks.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [universityId]
 *             properties:
 *               universityId:
 *                 type: string
 *                 pattern: '^\d{10}$'
 *                 example: "2020123456"
 *     responses:
 *       200:
 *         description: OTP sent (or silently skipped if user does not exist)
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     message:
 *                       example: "If this account exists, an OTP has been sent to your email"
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       403:
 *         description: Account is suspended or cancelled
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               error:
 *                 message: "Your account is not active. Contact hall office."
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     tags: [Password]
 *     summary: Reset password using OTP from email
 *     description: |
 *       Verifies the 6-digit OTP sent to the user's email and sets a new password.
 *       On success, all existing refresh tokens are revoked for security.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [universityId, otp, newPassword]
 *             properties:
 *               universityId:
 *                 type: string
 *                 pattern: '^\d{10}$'
 *                 example: "2020123456"
 *               otp:
 *                 type: string
 *                 pattern: '^\d{6}$'
 *                 example: "483920"
 *                 description: 6-digit numeric OTP from email
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *                 example: "NewSecure@789"
 *                 description: |
 *                   Must contain: uppercase, lowercase, number, special character (@$!%*?&)
 *     responses:
 *       200:
 *         description: Password reset successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     message:
 *                       example: "Password reset successfully"
 *       400:
 *         description: Invalid or expired OTP
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               invalidOtp:
 *                 summary: Wrong OTP
 *                 value:
 *                   success: false
 *                   error:
 *                     message: "Invalid OTP"
 *               expiredOtp:
 *                 summary: OTP expired
 *                 value:
 *                   success: false
 *                   error:
 *                     message: "OTP has expired. Please request a new one."
 *               noToken:
 *                 summary: No reset was requested
 *                 value:
 *                   success: false
 *                   error:
 *                     message: "Invalid or expired OTP"
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */

/**
 * @swagger
 * /api/auth/change-password:
 *   post:
 *     tags: [Password]
 *     summary: Change password for logged-in user
 *     description: |
 *       Allows authenticated users to change their own password.
 *       On success, all existing refresh tokens are revoked — user must log in again
 *       on other devices.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [oldPassword, newPassword, confirmPassword]
 *             properties:
 *               oldPassword:
 *                 type: string
 *                 example: "CurrentPass@123"
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *                 example: "NewSecure@456"
 *                 description: |
 *                   Must contain: uppercase, lowercase, number, special character (@$!%*?&).
 *                   Cannot be the same as the current password.
 *               confirmPassword:
 *                 type: string
 *                 example: "NewSecure@456"
 *     responses:
 *       200:
 *         description: Password changed successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     message:
 *                       example: "Password changed successfully"
 *       400:
 *         description: Validation error or password rules violated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               wrongOld:
 *                 summary: Current password incorrect
 *                 value:
 *                   success: false
 *                   error:
 *                     message: "Current password is incorrect"
 *               samePassword:
 *                 summary: New password same as current
 *                 value:
 *                   success: false
 *                   error:
 *                     message: "New password cannot be same as current"
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */

// ============================================================================
// PROFILE ROUTES
// ============================================================================

/**
 * @swagger
 * /api/auth/profile:
 *   get:
 *     tags: [Profile]
 *     summary: Get current user's profile
 *     description: |
 *       Returns the full profile of the authenticated user including room,
 *       emergency contacts, and guardian info where applicable.
 *       Sensitive fields (password, tokens) are never returned.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/User'
 *                     message:
 *                       example: "Profile retrieved successfully"
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */

/**
 * @swagger
 * /api/auth/users/{universityId}:
 *   get:
 *     tags: [Profile]
 *     summary: Get user by university ID
 *     description: |
 *       Returns a user's profile by their university ID.
 *       Restricted to SUPER_ADMIN and PROVOST only.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: universityId
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^\d{10}$'
 *         example: "2020123456"
 *         description: 10-digit university ID of the target user
 *     responses:
 *       200:
 *         description: User retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/User'
 *                     message:
 *                       example: "User retrieved successfully"
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: Insufficient permissions — SUPER_ADMIN or PROVOST only
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               error:
 *                 message: "You do not have permission to perform this action"
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
