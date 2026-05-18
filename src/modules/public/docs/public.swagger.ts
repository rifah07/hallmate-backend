/**
 * @swagger
 * components:
 *   schemas:
 *
 *     HallInfo:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *           example: "Shaheed Sergeant Zahurul Haq Hall"
 *         established:
 *           type: integer
 *           example: 1959
 *         location:
 *           type: string
 *           example: "University of Dhaka, Dhaka-1000"
 *         description:
 *           type: string
 *         vision:
 *           type: string
 *           nullable: true
 *         mission:
 *           type: string
 *           nullable: true
 *         capacity:
 *           type: integer
 *           example: 800
 *         totalRooms:
 *           type: integer
 *           example: 240
 *         logoUrl:
 *           type: string
 *           format: uri
 *           nullable: true
 *         coverUrl:
 *           type: string
 *           format: uri
 *           nullable: true
 *         mapEmbedUrl:
 *           type: string
 *           nullable: true
 *         email:
 *           type: string
 *           format: email
 *           nullable: true
 *         phone:
 *           type: string
 *           nullable: true
 *         address:
 *           type: string
 *           nullable: true
 *         socialLinks:
 *           type: object
 *           nullable: true
 *           properties:
 *             facebook:
 *               type: string
 *             website:
 *               type: string
 *
 *     ProvostUser:
 *       type: object
 *       description: Current provost info pulled from the User table
 *       properties:
 *         name:
 *           type: string
 *           example: "Prof. Dr. Md. Anisur Rahman"
 *         photo:
 *           type: string
 *           format: uri
 *           nullable: true
 *         designation:
 *           type: string
 *           example: "Provost"
 *         department:
 *           type: string
 *           example: "Department of Physics"
 *           nullable: true
 *         provostMessage:
 *           type: string
 *           nullable: true
 *         tenureStart:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         tenureEnd:
 *           type: string
 *           format: date-time
 *           nullable: true
 *
 *     ProvostHistory:
 *       type: object
 *       description: A single provost history record (public-safe fields only)
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *           example: "Prof. Dr. Md. Kamal Hossain"
 *         photoUrl:
 *           type: string
 *           format: uri
 *           nullable: true
 *           description: Cloudinary-hosted image URL
 *         designation:
 *           type: string
 *           example: "Provost"
 *         department:
 *           type: string
 *           nullable: true
 *           example: "Department of Mathematics"
 *         tenureStart:
 *           type: string
 *           format: date-time
 *           example: "2020-01-15T00:00:00.000Z"
 *         tenureEnd:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: null means currently serving
 *           example: null
 *         isCurrent:
 *           type: boolean
 *           example: true
 *         bio:
 *           type: string
 *           nullable: true
 *
 *     CreateProvostHistoryBody:
 *       type: object
 *       required: [name, tenureStart]
 *       properties:
 *         name:
 *           type: string
 *           minLength: 2
 *           maxLength: 100
 *           example: "Prof. Dr. Md. Kamal Hossain"
 *         designation:
 *           type: string
 *           maxLength: 100
 *           example: "Provost"
 *           default: "Provost"
 *         department:
 *           type: string
 *           maxLength: 150
 *           example: "Department of Mathematics"
 *         tenureStart:
 *           type: string
 *           format: date
 *           example: "2020-01-15"
 *         tenureEnd:
 *           type: string
 *           format: date
 *           nullable: true
 *           example: "2023-01-14"
 *           description: Omit or leave null if currently serving
 *         isCurrent:
 *           type: string
 *           enum: ["true", "false"]
 *           example: "true"
 *           description: |
 *             String "true"/"false" because this is multipart/form-data.
 *             Setting to true automatically unmarks all other current provosts.
 *         bio:
 *           type: string
 *           maxLength: 2000
 *         sortOrder:
 *           type: integer
 *           example: 1
 *         userId:
 *           type: string
 *           format: uuid
 *           description: |
 *             Link this record to a User account. Used by the self-edit guard —
 *             a PROVOST whose userId matches this field cannot edit or delete it.
 *             Supply the provost's User.id when creating their current record.
 *         photo:
 *           type: string
 *           format: binary
 *           description: Profile photo (JPEG, PNG, WebP — max 5MB)
 *
 *     HouseTutor:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *         designation:
 *           type: string
 *         department:
 *           type: string
 *         floor:
 *           type: integer
 *           nullable: true
 *         wing:
 *           type: string
 *           nullable: true
 *           example: "A"
 *         email:
 *           type: string
 *           format: email
 *           nullable: true
 *         phone:
 *           type: string
 *           nullable: true
 *         photoUrl:
 *           type: string
 *           format: uri
 *           nullable: true
 *         bio:
 *           type: string
 *           nullable: true
 *         officeHours:
 *           type: string
 *           nullable: true
 *           example: "Saturday – Wednesday, 10:00 AM – 12:00 PM"
 *
 *     StaffProfile:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *         designation:
 *           type: string
 *         category:
 *           type: string
 *           enum: [ADMINISTRATIVE, ACADEMIC, SUPPORT, SECURITY, DINING, MAINTENANCE]
 *         department:
 *           type: string
 *           nullable: true
 *         email:
 *           type: string
 *           format: email
 *           nullable: true
 *         phone:
 *           type: string
 *           nullable: true
 *         photoUrl:
 *           type: string
 *           format: uri
 *           nullable: true
 *         bio:
 *           type: string
 *           nullable: true
 *         qualifications:
 *           type: string
 *           nullable: true
 *         joiningDate:
 *           type: string
 *           format: date-time
 *           nullable: true
 *
 *     Facility:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *           example: "Reading Room"
 *         slug:
 *           type: string
 *           example: "reading-room"
 *         category:
 *           type: string
 *           enum: [ACCOMMODATION, DINING, SPORTS, ACADEMIC, HEALTH, RECREATION, UTILITIES]
 *         description:
 *           type: string
 *         iconUrl:
 *           type: string
 *           format: uri
 *           nullable: true
 *         imageUrl:
 *           type: string
 *           format: uri
 *           nullable: true
 *
 *     DiningInfo:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         mealPlan:
 *           type: object
 *           description: Breakfast, lunch, and dinner timings and prices
 *           properties:
 *             breakfast:
 *               $ref: '#/components/schemas/MealSlot'
 *             lunch:
 *               $ref: '#/components/schemas/MealSlot'
 *             dinner:
 *               $ref: '#/components/schemas/MealSlot'
 *         weeklyMenu:
 *           type: object
 *           nullable: true
 *           description: Day-by-day menu (saturday through friday)
 *         specialDiets:
 *           type: array
 *           items:
 *             type: string
 *           example: ["Vegetarian options available", "Low-sodium meals on request"]
 *         capacity:
 *           type: integer
 *           nullable: true
 *           example: 500
 *         location:
 *           type: string
 *           nullable: true
 *           example: "Ground Floor, Block C"
 *         imageUrl:
 *           type: string
 *           format: uri
 *           nullable: true
 *         contactPhone:
 *           type: string
 *           nullable: true
 *         notice:
 *           type: string
 *           nullable: true
 *
 *     MealSlot:
 *       type: object
 *       properties:
 *         time:
 *           type: string
 *           example: "7:00 AM – 9:30 AM"
 *         price:
 *           type: number
 *           example: 30
 *         description:
 *           type: string
 *           example: "Rice/bread, dal, vegetables, egg"
 *
 *     Achievement:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         title:
 *           type: string
 *           example: "Best Hall Award – University of Dhaka"
 *         description:
 *           type: string
 *         category:
 *           type: string
 *           example: "INSTITUTIONAL"
 *         imageUrl:
 *           type: string
 *           format: uri
 *           nullable: true
 *         year:
 *           type: integer
 *           example: 2023
 *         isFeatured:
 *           type: boolean
 *
 *     PublicEvent:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         title:
 *           type: string
 *           example: "Annual Hall Week 2025"
 *         slug:
 *           type: string
 *           example: "annual-hall-week-2025"
 *         summary:
 *           type: string
 *           nullable: true
 *         venue:
 *           type: string
 *           nullable: true
 *           example: "Hall Premises & Auditorium"
 *         imageUrl:
 *           type: string
 *           format: uri
 *           nullable: true
 *         startDate:
 *           type: string
 *           format: date-time
 *         endDate:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         isAllDay:
 *           type: boolean
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *         isFeatured:
 *           type: boolean
 *
 *     PublicNotice:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         title:
 *           type: string
 *           example: "Seat Allocation Results – Academic Year 2024-25"
 *         slug:
 *           type: string
 *           example: "seat-allocation-results-2024-25"
 *         summary:
 *           type: string
 *           nullable: true
 *         priority:
 *           type: string
 *           enum: [LOW, NORMAL, HIGH, URGENT]
 *         category:
 *           type: string
 *           example: "ADMISSION"
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *         pdfUrl:
 *           type: string
 *           format: uri
 *           nullable: true
 *         publishedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         expiresAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: null means never expires
 *         views:
 *           type: integer
 *           example: 142
 *
 *     PublicNoticeDetail:
 *       allOf:
 *         - $ref: '#/components/schemas/PublicNotice'
 *         - type: object
 *           properties:
 *             content:
 *               type: string
 *               description: Full notice body (only returned on detail endpoint)
 *             imageUrl:
 *               type: string
 *               format: uri
 *               nullable: true
 *             createdAt:
 *               type: string
 *               format: date-time
 *
 *     GalleryItem:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         title:
 *           type: string
 *           example: "Annual Cultural Night 2024"
 *         description:
 *           type: string
 *           nullable: true
 *         imageUrl:
 *           type: string
 *           format: uri
 *         thumbnailUrl:
 *           type: string
 *           format: uri
 *           nullable: true
 *         category:
 *           type: string
 *           enum: [INFRASTRUCTURE, EVENTS, SPORTS, CULTURAL, ACADEMICS, DINING, GENERAL]
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *         capturedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *
 *     FAQ:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         question:
 *           type: string
 *           example: "How can I apply for a seat in the hall?"
 *         answer:
 *           type: string
 *         category:
 *           type: string
 *           example: "ADMISSION"
 *
 *     AdmissionInfo:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         session:
 *           type: string
 *           example: "2024-25"
 *         eligibility:
 *           type: string
 *         process:
 *           type: string
 *         requiredDocs:
 *           type: array
 *           items:
 *             type: string
 *         importantDates:
 *           type: object
 *           nullable: true
 *           properties:
 *             applicationStart:
 *               type: string
 *               format: date
 *             applicationEnd:
 *               type: string
 *               format: date
 *             resultDate:
 *               type: string
 *               format: date
 *             joiningDeadline:
 *               type: string
 *               format: date
 *         seatCapacity:
 *           type: integer
 *           nullable: true
 *           example: 800
 *         applicationFee:
 *           type: number
 *           nullable: true
 *           example: 0
 *         contactEmail:
 *           type: string
 *           format: email
 *           nullable: true
 *         contactPhone:
 *           type: string
 *           nullable: true
 *
 *     ContactSubmissionBody:
 *       type: object
 *       required: [name, email, subject, message]
 *       properties:
 *         name:
 *           type: string
 *           minLength: 2
 *           maxLength: 100
 *           example: "Md. Rahim Uddin"
 *         email:
 *           type: string
 *           format: email
 *           example: "rahim@example.com"
 *         phone:
 *           type: string
 *           example: "01712345678"
 *           description: Bangladeshi phone number (optional)
 *         subject:
 *           type: string
 *           minLength: 5
 *           maxLength: 200
 *           example: "Inquiry about seat application process"
 *         message:
 *           type: string
 *           minLength: 20
 *           maxLength: 2000
 *           example: "I would like to know more about the seat application process for the 2025-26 session."
 *
 *     PublicApplicationBody:
 *       type: object
 *       required: [type, applicantName, applicantEmail, applicantPhone, subject, message]
 *       properties:
 *         type:
 *           type: string
 *           enum: [SEAT_REQUEST, INFORMATION_REQUEST, GENERAL_INQUIRY, ADMISSION_QUERY]
 *           example: "SEAT_REQUEST"
 *         applicantName:
 *           type: string
 *           minLength: 2
 *           maxLength: 100
 *           example: "Fatema Akter"
 *         applicantEmail:
 *           type: string
 *           format: email
 *           example: "fatema@student.du.ac.bd"
 *         applicantPhone:
 *           type: string
 *           example: "01812345678"
 *         studentId:
 *           type: string
 *           maxLength: 20
 *           example: "2021-1-60-012"
 *           description: University student ID (optional)
 *         program:
 *           type: string
 *           enum: [UNDERGRADUATE, MASTERS, PHD]
 *           example: "UNDERGRADUATE"
 *         department:
 *           type: string
 *           example: "Computer Science & Engineering"
 *         session:
 *           type: string
 *           pattern: '^\d{4}-\d{2,4}$'
 *           example: "2021-22"
 *         subject:
 *           type: string
 *           minLength: 5
 *           maxLength: 200
 *           example: "Seat request for 2025-26 academic year"
 *         message:
 *           type: string
 *           minLength: 20
 *           maxLength: 3000
 *         attachments:
 *           type: array
 *           maxItems: 5
 *           items:
 *             type: string
 *             format: uri
 *           description: URLs of previously uploaded documents (max 5)
 *
 *     ApplicationTrackingResponse:
 *       type: object
 *       description: Safe public view of an application — no internal notes or assigned staff
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         type:
 *           type: string
 *           enum: [SEAT_REQUEST, INFORMATION_REQUEST, GENERAL_INQUIRY, ADMISSION_QUERY]
 *         status:
 *           type: string
 *           enum: [PENDING, APPROVED, REJECTED, CANCELLED]
 *         subject:
 *           type: string
 *         responseNote:
 *           type: string
 *           nullable: true
 *           description: Admin's response message (if any)
 *         respondedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     PublicPaginationMeta:
 *       type: object
 *       properties:
 *         page:
 *           type: integer
 *           example: 1
 *         limit:
 *           type: integer
 *           example: 10
 *         total:
 *           type: integer
 *           example: 48
 *         totalPages:
 *           type: integer
 *           example: 5
 */
// ============================================================================
// TAGS
// ============================================================================

/**
 * @swagger
 * tags:
 *   - name: Public
 *     description: Publicly accessible read-only endpoints — no authentication required
 *   - name: Provost Management
 *     description: Provost history write operations — requires SUPER_ADMIN or PROVOST role
 */

// ============================================================================
// HALL INFO
// ============================================================================

/**
 * @swagger
 * /api/public/hall-info:
 *   get:
 *     tags: [Public]
 *     summary: Get hall information
 *     description: |
 *       Returns general information about the hall including name, history,
 *       capacity, contact details, and social links.
 *       Response is cached for 1 hour.
 *     responses:
 *       200:
 *         description: Hall info retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/HallInfo'
 */

// ============================================================================
// ABOUT
// ============================================================================

/**
 * @swagger
 * /api/public/about:
 *   get:
 *     tags: [Public]
 *     summary: Get about page content
 *     description: |
 *       Returns hall info summary alongside flexible structured content
 *       (history, milestones, values) from the CMS page content table.
 *       Response is cached for 1 hour.
 *     responses:
 *       200:
 *         description: About content retrieved successfully
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
 *                         hallInfo:
 *                           $ref: '#/components/schemas/HallInfo'
 *                         pageContent:
 *                           type: object
 *                           nullable: true
 *                           description: Flexible CMS content (history, milestones, values)
 */

// ============================================================================
// PROVOST (CURRENT — from User table)
// ============================================================================

/**
 * @swagger
 * /api/public/provost:
 *   get:
 *     tags: [Public]
 *     summary: Get current provost info
 *     description: |
 *       Returns the currently active provost's basic info from the User table.
 *       For the full provost history list, use `GET /api/public/provosts`.
 *       Response is cached for 15 minutes.
 *     responses:
 *       200:
 *         description: Provost info retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/ProvostUser'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */

// ============================================================================
// PROVOST HISTORY (public read)
// ============================================================================

/**
 * @swagger
 * /api/public/provosts:
 *   get:
 *     tags: [Public]
 *     summary: Get all provosts with tenure info
 *     description: |
 *       Returns all provost history records ordered by current-first,
 *       then tenure start descending. Includes photo, designation, and bio.
 *       Internal fields (photoPublicId, userId) are never exposed.
 *       Response is cached for 15 minutes.
 *     responses:
 *       200:
 *         description: Provost history retrieved successfully
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
 *                         $ref: '#/components/schemas/ProvostHistory'
 */

// ============================================================================
// PROVOST HISTORY — admin write
// ============================================================================

/**
 * @swagger
 * /api/public/provosts:
 *   post:
 *     tags: [Provost Management]
 *     summary: Create a provost history record
 *     description: |
 *       Creates a new provost history record with optional Cloudinary photo upload.
 *
 *       **Business rules:**
 *       - If `isCurrent` is `"true"`, all other records are automatically unmarked
 *       - Supply `userId` to link the record to a User account — this activates
 *         the self-edit guard (the PROVOST with that userId cannot edit/delete this record)
 *       - Photo is uploaded to Cloudinary under `hallmate/provosts/`
 *
 *       **Access:** SUPER_ADMIN, PROVOST
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/CreateProvostHistoryBody'
 *     responses:
 *       201:
 *         description: Provost record created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/ProvostHistory'
 *                     message:
 *                       example: "Provost record created"
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *
 * /api/public/provosts/{id}:
 *   patch:
 *     tags: [Provost Management]
 *     summary: Update a provost history record
 *     description: |
 *       Partially updates an existing provost record. All fields are optional.
 *       If a new photo is uploaded, the old Cloudinary asset is deleted first.
 *
 *       **Self-edit rule:**
 *       A PROVOST whose User account is linked to this record (via `userId`)
 *       cannot edit it. Only a SUPER_ADMIN can modify their own record.
 *
 *       **Access:** SUPER_ADMIN, PROVOST (self-edit blocked)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ProvostHistory record ID
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             allOf:
 *               - $ref: '#/components/schemas/CreateProvostHistoryBody'
 *               - type: object
 *                 description: All fields are optional for PATCH
 *     responses:
 *       200:
 *         description: Provost record updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/ProvostHistory'
 *                     message:
 *                       example: "Provost record updated"
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: Forbidden — PROVOST attempted to edit their own record
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               error:
 *                 message: "You cannot modify your own provost record. Contact the Super Admin."
 *                 code: "SELF_EDIT_FORBIDDEN"
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *
 *   delete:
 *     tags: [Provost Management]
 *     summary: Delete a provost history record
 *     description: |
 *       Permanently deletes a provost record and its associated Cloudinary photo.
 *       Cloudinary deletion failure is non-fatal — the DB record is still removed.
 *
 *       **Self-edit rule:** Same as PATCH — a PROVOST cannot delete their own record.
 *
 *       **Access:** SUPER_ADMIN, PROVOST (self-delete blocked)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Provost record deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     message:
 *                       example: "Provost record deleted"
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: Forbidden — PROVOST attempted to delete their own record
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               error:
 *                 message: "You cannot modify your own provost record. Contact the Super Admin."
 *                 code: "SELF_EDIT_FORBIDDEN"
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
// ============================================================================
// HOUSE TUTORS
// ============================================================================

/**
 * @swagger
 * /api/public/house-tutors:
 *   get:
 *     tags: [Public]
 *     summary: Get all active house tutors
 *     description: |
 *       Returns all active house tutor profiles ordered by floor and sort order.
 *       Response is cached for 15 minutes.
 *     responses:
 *       200:
 *         description: House tutors retrieved successfully
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
 *                         $ref: '#/components/schemas/HouseTutor'
 */

// ============================================================================
// STAFF
// ============================================================================

/**
 * @swagger
 * /api/public/staff:
 *   get:
 *     tags: [Public]
 *     summary: Get public staff list
 *     description: |
 *       Returns paginated public staff profiles (isPublic = true only).
 *       Supports filtering by category and free-text search.
 *       Response is cached for 15 minutes.
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
 *           default: 10
 *           maximum: 100
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [ADMINISTRATIVE, ACADEMIC, SUPPORT, SECURITY, DINING, MAINTENANCE]
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Case-insensitive search on name, designation, department
 *     responses:
 *       200:
 *         description: Staff list retrieved successfully
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
 *                     $ref: '#/components/schemas/StaffProfile'
 *                 meta:
 *                   $ref: '#/components/schemas/PublicPaginationMeta'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
