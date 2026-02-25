/**
 * @swagger
 * components:
 *   schemas:
 *     CreateUserBody:
 *       type: object
 *       required: [universityId, role, name, email, phone]
 *       properties:
 *         universityId:
 *           type: string
 *           pattern: '^\d{10}$'
 *           example: "2020123456"
 *         role:
 *           type: string
 *           enum: [SUPER_ADMIN, PROVOST, HOUSE_TUTOR, ASSISTANT_WARDEN, OFFICE_STAFF, DINING_STAFF, MAINTENANCE_STAFF, GUARD, STUDENT, PARENT]
 *           example: "STUDENT"
 *         name:
 *           type: string
 *           minLength: 2
 *           maxLength: 100
 *           example: "Fatema Ahmed"
 *         email:
 *           type: string
 *           format: email
 *           example: "fatema@uni.edu.bd"
 *         phone:
 *           type: string
 *           example: "01712345678"
 *         department:
 *           type: string
 *           example: "Computer Science"
 *           description: Required if role is STUDENT
 *         year:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *           example: 3
 *           description: Required if role is STUDENT
 *         program:
 *           type: string
 *           enum: [UNDERGRADUATE, MASTERS, PHD]
 *           example: "UNDERGRADUATE"
 *           description: Required if role is STUDENT
 *         session:
 *           type: string
 *           example: "2020-21"
 *           description: Required if role is STUDENT
 *         bloodGroup:
 *           type: string
 *           enum: [A_POSITIVE, A_NEGATIVE, B_POSITIVE, B_NEGATIVE, O_POSITIVE, O_NEGATIVE, AB_POSITIVE, AB_NEGATIVE]
 *         assignedFloor:
 *           type: integer
 *           minimum: 1
 *           maximum: 14
 *           description: Required if role is HOUSE_TUTOR
 *         designation:
 *           type: string
 *           description: Required for staff roles
 *
 *     UpdateUserBody:
 *       type: object
 *       description: At least one field required
 *       properties:
 *         name:
 *           type: string
 *           minLength: 2
 *           maxLength: 100
 *         email:
 *           type: string
 *           format: email
 *         phone:
 *           type: string
 *         bloodGroup:
 *           type: string
 *           enum: [A_POSITIVE, A_NEGATIVE, B_POSITIVE, B_NEGATIVE, O_POSITIVE, O_NEGATIVE, AB_POSITIVE, AB_NEGATIVE]
 *         photo:
 *           type: string
 *           format: url
 *         department:
 *           type: string
 *         year:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *         medicalConditions:
 *           type: string
 *         allergies:
 *           type: string
 *         assignedFloor:
 *           type: integer
 *           minimum: 1
 *           maximum: 14
 *         designation:
 *           type: string
 *
 *     UserStatistics:
 *       type: object
 *       properties:
 *         totalUsers:
 *           type: integer
 *         activeUsers:
 *           type: integer
 *         inactiveUsers:
 *           type: integer
 *         suspendedUsers:
 *           type: integer
 *         byRole:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               role:
 *                 type: string
 *               count:
 *                 type: integer
 *         byDepartment:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               department:
 *                 type: string
 *               count:
 *                 type: integer
 *         byYear:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               year:
 *                 type: integer
 *               count:
 *                 type: integer
 *         newUsersThisMonth:
 *           type: integer
 *         newUsersThisYear:
 *           type: integer
 *
 *     PaginationMeta:
 *       type: object
 *       properties:
 *         page:
 *           type: integer
 *           example: 1
 *         limit:
 *           type: integer
 *           example: 20
 *         total:
 *           type: integer
 *           example: 100
 *         totalPages:
 *           type: integer
 *           example: 5
 */

/**
 * @swagger
 * tags:
 *   - name: Users
 *     description: User management — CRUD, roles, status, statistics
 */

// ============================================================================
// COLLECTION ROUTES
// ============================================================================

/**
 * @swagger
 * /api/users:
 *   get:
 *     tags: [Users]
 *     summary: Get all users with filters and pagination
 *     description: |
 *       Returns paginated list of users. Supports filtering by role, status,
 *       department, year, program, floor, and free-text search.
 *
 *       **Access:** SUPER_ADMIN, PROVOST, HOUSE_TUTOR, OFFICE_STAFF
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 100
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [SUPER_ADMIN, PROVOST, HOUSE_TUTOR, ASSISTANT_WARDEN, OFFICE_STAFF, DINING_STAFF, MAINTENANCE_STAFF, GUARD, STUDENT, PARENT]
 *       - in: query
 *         name: accountStatus
 *         schema:
 *           type: string
 *           enum: [ACTIVE, SUSPENDED, SEAT_CANCELLED, INACTIVE, GRADUATED]
 *       - in: query
 *         name: department
 *         schema:
 *           type: string
 *           example: "Computer Science"
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *       - in: query
 *         name: program
 *         schema:
 *           type: string
 *           enum: [UNDERGRADUATE, MASTERS, PHD]
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name, email, or university ID
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, name, universityId, role]
 *           default: createdAt
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *                 meta:
 *                   $ref: '#/components/schemas/PaginationMeta'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *
 *   post:
 *     tags: [Users]
 *     summary: Create a new user
 *     description: |
 *       Creates a new user and sends a one-time password to their email.
 *       The user must complete first-time login to set their permanent password.
 *
 *       **Validation rules:**
 *       - STUDENT role requires: department, year, program, session
 *       - HOUSE_TUTOR role requires: assignedFloor
 *
 *       **Access:** SUPER_ADMIN, PROVOST
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateUserBody'
 *     responses:
 *       201:
 *         description: User created successfully
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
 *                       example: "User created successfully. One-time password sent to email."
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       409:
 *         description: University ID or email already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               duplicateId:
 *                 value:
 *                   success: false
 *                   error:
 *                     message: "University ID already exists"
 *               duplicateEmail:
 *                 value:
 *                   success: false
 *                   error:
 *                     message: "Email already exists"
 */

// ============================================================================
// ADMIN ROUTES
// ============================================================================

/**
 * @swagger
 * /api/users/statistics:
 *   get:
 *     tags: [Users]
 *     summary: Get user statistics
 *     description: |
 *       Returns aggregated statistics including total counts, role distribution,
 *       department breakdown, and new user trends.
 *
 *       **Access:** SUPER_ADMIN, PROVOST
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/UserStatistics'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */

/**
 * @swagger
 * /api/users/bulk:
 *   post:
 *     tags: [Users]
 *     summary: Bulk create users
 *     description: |
 *       Creates multiple users in a single request. Maximum 100 users per request.
 *       Duplicate university IDs or emails are silently skipped.
 *
 *       **Access:** SUPER_ADMIN only
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [users]
 *             properties:
 *               users:
 *                 type: array
 *                 minItems: 1
 *                 maxItems: 100
 *                 items:
 *                   $ref: '#/components/schemas/CreateUserBody'
 *     responses:
 *       201:
 *         description: Bulk creation completed
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
 *                         created:
 *                           type: integer
 *                           example: 45
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */

// ============================================================================
// FILTER ROUTES
// ============================================================================

/**
 * @swagger
 * /api/users/role/{role}:
 *   get:
 *     tags: [Users]
 *     summary: Get all active users by role
 *     description: |
 *       **Access:** SUPER_ADMIN, PROVOST, HOUSE_TUTOR
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: role
 *         required: true
 *         schema:
 *           type: string
 *           enum: [SUPER_ADMIN, PROVOST, HOUSE_TUTOR, ASSISTANT_WARDEN, OFFICE_STAFF, DINING_STAFF, MAINTENANCE_STAFF, GUARD, STUDENT, PARENT]
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/User'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */

/**
 * @swagger
 * /api/users/floor/{floor}:
 *   get:
 *     tags: [Users]
 *     summary: Get all students on a specific floor
 *     description: |
 *       Returns active students whose current room is on the specified floor.
 *
 *       **Access:** SUPER_ADMIN, PROVOST, HOUSE_TUTOR
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: floor
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 14
 *         example: 3
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/User'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */

/**
 * @swagger
 * /api/users/university/{universityId}:
 *   get:
 *     tags: [Users]
 *     summary: Get user by university ID
 *     description: |
 *       **Access:** SUPER_ADMIN, PROVOST, HOUSE_TUTOR, OFFICE_STAFF
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
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */

// ============================================================================
// SINGLE USER ROUTES
// ============================================================================

/**
 * @swagger
 * /api/users/{userId}:
 *   get:
 *     tags: [Users]
 *     summary: Get user by ID
 *     description: |
 *       **Access:** SUPER_ADMIN, PROVOST, HOUSE_TUTOR, OFFICE_STAFF
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
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
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *
 *   patch:
 *     tags: [Users]
 *     summary: Update user profile
 *     description: |
 *       Users can update their own profile. Admins can update any profile.
 *       At least one field must be provided.
 *
 *       **Access:** All authenticated users (ownership enforced in service)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateUserBody'
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/User'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       409:
 *         description: Email already in use
 *
 *   delete:
 *     tags: [Users]
 *     summary: Soft delete user
 *     description: |
 *       Soft deletes a user — anonymizes email/phone, revokes all tokens,
 *       sets account to INACTIVE. Data is retained for audit purposes.
 *       Use `/restore` to undo.
 *
 *       **Access:** SUPER_ADMIN, PROVOST
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: User deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     message:
 *                       example: "User deleted successfully"
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */

/**
 * @swagger
 * /api/users/{userId}/role:
 *   patch:
 *     tags: [Users]
 *     summary: Update user role
 *     description: |
 *       **Access:** SUPER_ADMIN only
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [role]
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [SUPER_ADMIN, PROVOST, HOUSE_TUTOR, ASSISTANT_WARDEN, OFFICE_STAFF, DINING_STAFF, MAINTENANCE_STAFF, GUARD, STUDENT, PARENT]
 *     responses:
 *       200:
 *         description: Role updated successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */

/**
 * @swagger
 * /api/users/{userId}/status:
 *   patch:
 *     tags: [Users]
 *     summary: Update account status
 *     description: |
 *       **Access:** SUPER_ADMIN, PROVOST
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [accountStatus]
 *             properties:
 *               accountStatus:
 *                 type: string
 *                 enum: [ACTIVE, SUSPENDED, SEAT_CANCELLED, INACTIVE, GRADUATED]
 *     responses:
 *       200:
 *         description: Status updated successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */

/**
 * @swagger
 * /api/users/{userId}/restore:
 *   post:
 *     tags: [Users]
 *     summary: Restore a soft-deleted user
 *     description: |
 *       Restores a previously soft-deleted user and sets status back to ACTIVE.
 *
 *       **Access:** SUPER_ADMIN only
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: User restored successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */

/**
 * @swagger
 * /api/users/{userId}/profile-picture:
 *   post:
 *     tags: [Users]
 *     summary: Upload profile picture
 *     description: |
 *       Users can upload their own profile picture.
 *       Admins can upload for any user.
 *       File is uploaded to Cloudinary.
 *
 *       **Access:** All authenticated users (ownership enforced in service)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file]
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Profile picture uploaded successfully
 *       400:
 *         description: No file uploaded
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *
 *   delete:
 *     tags: [Users]
 *     summary: Delete profile picture
 *     description: |
 *       **Access:** All authenticated users (ownership enforced in service)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Profile picture deleted successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
