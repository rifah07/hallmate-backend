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

/**
 * @swagger
 * tags:
 *   - name: Applications
 *     description: Application management system (seat, leave, complaints, maintenance)
 */

/**
 * @swagger
 * /api/applications/statistics:
 *   get:
 *     tags: [Applications]
 *     summary: Get application statistics
 *     description: |
 *       Returns aggregated statistics.
 *
 *       **Access:** SUPER_ADMIN, PROVOST, HOUSE_TUTOR, OFFICE_STAFF, STUDENT
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 */

/**
 * @swagger
 * /api/applications/my-applications:
 *   get:
 *     tags: [Applications]
 *     summary: Get my applications
 *     description: |
 *       Returns applications of authenticated student.
 *
 *       **Access:** STUDENT
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Applications retrieved
 */

/**
 * @swagger
 * /api/applications/assigned:
 *   get:
 *     tags: [Applications]
 *     summary: Get assigned applications
 *     description: |
 *       Returns applications assigned to the authenticated staff member.
 *
 *       **Access:** SUPER_ADMIN, PROVOST, HOUSE_TUTOR, OFFICE_STAFF, ASSISTANT_WARDEN
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Applications retrieved
 */

/**
 * @swagger
 * /api/applications:
 *   get:
 *     tags: [Applications]
 *     summary: Get all applications
 *     description: |
 *       Returns paginated applications with filters.
 *
 *       Students see only their own applications.
 *       Staff can see all or assigned applications.
 *
 *       **Access:** SUPER_ADMIN, PROVOST, HOUSE_TUTOR, OFFICE_STAFF, STUDENT
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: studentId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: assignedTo
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Applications retrieved
 *
 *   post:
 *     tags: [Applications]
 *     summary: Create application
 *     description: |
 *       Submit a new application.
 *
 *       **Access:** STUDENT
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateApplicationInput'
 *     responses:
 *       201:
 *         description: Application created successfully
 */

/**
 * @swagger
 * /api/applications/{applicationId}:
 *   get:
 *     tags: [Applications]
 *     summary: Get application by ID
 *     description: |
 *       Retrieve a specific application.
 *
 *       **Access:** SUPER_ADMIN, PROVOST, HOUSE_TUTOR, OFFICE_STAFF, STUDENT
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: applicationId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Application retrieved
 *
 *   patch:
 *     tags: [Applications]
 *     summary: Update application
 *     description: |
 *       Update own pending application only.
 *
 *       **Access:** STUDENT
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: applicationId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateApplicationInput'
 *     responses:
 *       200:
 *         description: Application updated
 *
 *   delete:
 *     tags: [Applications]
 *     summary: Delete application
 *     description: |
 *       Delete an application.
 *
 *       **Access:** SUPER_ADMIN, PROVOST
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: applicationId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Application deleted
 */
