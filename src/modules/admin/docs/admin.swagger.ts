/**
 * @swagger
 * components:
 *   schemas:
 *
 *     AdminHallInfoBody:
 *       type: object
 *       required: [name, established, location, description, capacity, totalRooms]
 *       properties:
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
 *         mission:
 *           type: string
 *         capacity:
 *           type: integer
 *           example: 800
 *         totalRooms:
 *           type: integer
 *           example: 240
 *         mapEmbedUrl:
 *           type: string
 *         email:
 *           type: string
 *           format: email
 *         phone:
 *           type: string
 *         address:
 *           type: string
 *         socialLinks:
 *           type: string
 *           description: JSON string e.g. '{"facebook":"https://..."}'
 *         isActive:
 *           type: string
 *           enum: ["true", "false"]
 *         image:
 *           type: string
 *           format: binary
 *           description: Cover image (uploaded to Cloudinary)
 *
 *     AdminFacilityBody:
 *       type: object
 *       required: [name, slug, category, description]
 *       properties:
 *         name:
 *           type: string
 *           example: "Reading Room"
 *         slug:
 *           type: string
 *           example: "reading-room"
 *           description: Lowercase letters, numbers, hyphens only. Must be unique.
 *         category:
 *           type: string
 *           enum: [ACCOMMODATION, DINING, SPORTS, ACADEMIC, HEALTH, RECREATION, UTILITIES]
 *         description:
 *           type: string
 *         isActive:
 *           type: string
 *           enum: ["true", "false"]
 *         sortOrder:
 *           type: integer
 *         image:
 *           type: string
 *           format: binary
 *
 *     AdminFAQBody:
 *       type: object
 *       required: [question, answer]
 *       properties:
 *         question:
 *           type: string
 *           example: "How do I apply for a seat?"
 *         answer:
 *           type: string
 *         category:
 *           type: string
 *           example: "ADMISSION"
 *           default: "GENERAL"
 *         isActive:
 *           type: string
 *           enum: ["true", "false"]
 *         sortOrder:
 *           type: integer
 *
 *     AdminDiningBody:
 *       type: object
 *       required: [mealPlan]
 *       properties:
 *         mealPlan:
 *           type: string
 *           description: JSON string with breakfast/lunch/dinner slots
 *           example: '{"breakfast":{"time":"7:00-9:30","price":30}}'
 *         weeklyMenu:
 *           type: string
 *           description: JSON string with day-by-day menu
 *         specialDiets:
 *           type: string
 *           description: Comma-separated list e.g. "Vegetarian,Low-sodium"
 *         capacity:
 *           type: integer
 *         location:
 *           type: string
 *         contactPhone:
 *           type: string
 *         notice:
 *           type: string
 *         isActive:
 *           type: string
 *           enum: ["true", "false"]
 *         image:
 *           type: string
 *           format: binary
 *
 *     AdminAchievementBody:
 *       type: object
 *       required: [title, description, year]
 *       properties:
 *         title:
 *           type: string
 *           example: "Best Hall Award 2023"
 *         description:
 *           type: string
 *         category:
 *           type: string
 *           example: "INSTITUTIONAL"
 *           default: "GENERAL"
 *         year:
 *           type: integer
 *           example: 2023
 *         isActive:
 *           type: string
 *           enum: ["true", "false"]
 *         isFeatured:
 *           type: string
 *           enum: ["true", "false"]
 *         sortOrder:
 *           type: integer
 *         image:
 *           type: string
 *           format: binary
 *
 *     AdminNoticeBody:
 *       type: object
 *       required: [title, slug, content]
 *       properties:
 *         title:
 *           type: string
 *           example: "Seat Allocation Results 2024-25"
 *         slug:
 *           type: string
 *           example: "seat-allocation-2024-25"
 *           description: Must be unique across all notices
 *         content:
 *           type: string
 *           description: Full notice body
 *         summary:
 *           type: string
 *         pdfUrl:
 *           type: string
 *           format: uri
 *         priority:
 *           type: string
 *           enum: [LOW, NORMAL, HIGH, URGENT]
 *           default: NORMAL
 *         category:
 *           type: string
 *           default: GENERAL
 *         tags:
 *           type: string
 *           description: Comma-separated e.g. "admission,seat"
 *         isPublished:
 *           type: string
 *           enum: ["true", "false"]
 *           description: Setting to true auto-sets publishedAt to now if not provided
 *         publishedAt:
 *           type: string
 *           format: date-time
 *         expiresAt:
 *           type: string
 *           format: date-time
 *         image:
 *           type: string
 *           format: binary
 *
 *     AdminEventBody:
 *       type: object
 *       required: [title, slug, description, startDate]
 *       properties:
 *         title:
 *           type: string
 *           example: "Annual Hall Week 2025"
 *         slug:
 *           type: string
 *           example: "annual-hall-week-2025"
 *           description: Must be unique across all events
 *         description:
 *           type: string
 *         summary:
 *           type: string
 *         venue:
 *           type: string
 *         startDate:
 *           type: string
 *           format: date-time
 *         endDate:
 *           type: string
 *           format: date-time
 *         isAllDay:
 *           type: string
 *           enum: ["true", "false"]
 *         tags:
 *           type: string
 *           description: Comma-separated
 *         isPublished:
 *           type: string
 *           enum: ["true", "false"]
 *         isFeatured:
 *           type: string
 *           enum: ["true", "false"]
 *         image:
 *           type: string
 *           format: binary
 *
 *     AdminGalleryItemBody:
 *       type: object
 *       required: [title, image]
 *       properties:
 *         title:
 *           type: string
 *           example: "Cultural Night 2024"
 *         description:
 *           type: string
 *         category:
 *           type: string
 *           enum: [INFRASTRUCTURE, EVENTS, SPORTS, CULTURAL, ACADEMICS, DINING, GENERAL]
 *           default: GENERAL
 *         tags:
 *           type: string
 *           description: Comma-separated
 *         isActive:
 *           type: string
 *           enum: ["true", "false"]
 *         sortOrder:
 *           type: integer
 *         capturedAt:
 *           type: string
 *           format: date-time
 *         image:
 *           type: string
 *           format: binary
 *           description: Required on create
 *
 *     AdminHouseTutorBody:
 *       type: object
 *       required: [name, department]
 *       properties:
 *         name:
 *           type: string
 *         designation:
 *           type: string
 *           default: "House Tutor"
 *         department:
 *           type: string
 *         floor:
 *           type: integer
 *         wing:
 *           type: string
 *           example: "A"
 *         email:
 *           type: string
 *           format: email
 *         phone:
 *           type: string
 *         bio:
 *           type: string
 *         officeHours:
 *           type: string
 *         isActive:
 *           type: string
 *           enum: ["true", "false"]
 *         sortOrder:
 *           type: integer
 *         image:
 *           type: string
 *           format: binary
 *           description: Profile photo
 *
 *     AdminStaffProfileBody:
 *       type: object
 *       required: [name, designation, category]
 *       properties:
 *         name:
 *           type: string
 *         designation:
 *           type: string
 *         category:
 *           type: string
 *           enum: [ADMINISTRATIVE, ACADEMIC, SUPPORT, SECURITY, DINING, MAINTENANCE]
 *         department:
 *           type: string
 *         email:
 *           type: string
 *           format: email
 *         phone:
 *           type: string
 *         bio:
 *           type: string
 *         qualifications:
 *           type: string
 *         joiningDate:
 *           type: string
 *           format: date-time
 *         isPublic:
 *           type: string
 *           enum: ["true", "false"]
 *         sortOrder:
 *           type: integer
 *         image:
 *           type: string
 *           format: binary
 *           description: Profile photo
 *
 *     AdminAdmissionBody:
 *       type: object
 *       required: [session, eligibility, process]
 *       properties:
 *         session:
 *           type: string
 *           example: "2024-25"
 *         eligibility:
 *           type: string
 *         process:
 *           type: string
 *         requiredDocs:
 *           type: string
 *           description: Newline-separated list of required documents
 *         importantDates:
 *           type: string
 *           description: JSON string with applicationStart/End, resultDate, joiningDeadline
 *         seatCapacity:
 *           type: integer
 *         applicationFee:
 *           type: number
 *         contactEmail:
 *           type: string
 *           format: email
 *         contactPhone:
 *           type: string
 *         faqItems:
 *           type: string
 *           description: JSON string array of FAQ items
 *         isActive:
 *           type: string
 *           enum: ["true", "false"]
 *         isCurrent:
 *           type: string
 *           enum: ["true", "false"]
 *           description: Setting to true automatically unmarks all other current admissions
 *
 *     AdminPageContentBody:
 *       type: object
 *       required: [page, content]
 *       properties:
 *         page:
 *           type: string
 *           example: "about"
 *           description: Unique page identifier
 *         content:
 *           type: string
 *           description: JSON string with flexible page content structure
 *         isActive:
 *           type: string
 *           enum: ["true", "false"]
 */
// ============================================================================
// TAGS
// ============================================================================

/**
 * @swagger
 * tags:
 *   - name: Admin - Hall Info
 *     description: Hall information management (SUPER_ADMIN only)
 *   - name: Admin - Facilities
 *     description: Facilities management
 *   - name: Admin - FAQ
 *     description: FAQ management
 *   - name: Admin - Dining
 *     description: Dining info management
 *   - name: Admin - Achievements
 *     description: Achievements management
 *   - name: Admin - Notices
 *     description: Notice management
 *   - name: Admin - Events
 *     description: Events management
 *   - name: Admin - Gallery
 *     description: Gallery management
 *   - name: Admin - House Tutors
 *     description: House tutor profiles management
 *   - name: Admin - Staff
 *     description: Staff profiles management
 *   - name: Admin - Admission
 *     description: Admission info management
 *   - name: Admin - Page Content
 *     description: CMS page content management
 */
// ============================================================================
// HALL INFO (SUPER_ADMIN only)
// ============================================================================

/**
 * @swagger
 * /api/admin/hall-info:
 *   post:
 *     tags: [Admin - Hall Info]
 *     summary: Create hall info (replaces existing)
 *     description: |
 *       Creates a new hall info record. Automatically deactivates any
 *       existing active record — only one active hall info exists at a time.
 *       **Access:** SUPER_ADMIN only
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/AdminHallInfoBody'
 *     responses:
 *       201:
 *         description: Hall info created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *
 * /api/admin/hall-info/{id}:
 *   patch:
 *     tags: [Admin - Hall Info]
 *     summary: Update hall info
 *     description: |
 *       Partially updates an existing hall info record.
 *       If a new image is uploaded, the old Cloudinary asset is deleted first.
 *       **Access:** SUPER_ADMIN only
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/AdminHallInfoBody'
 *     responses:
 *       200:
 *         description: Hall info updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *
 *   delete:
 *     tags: [Admin - Hall Info]
 *     summary: Delete hall info
 *     description: |
 *       Deletes a hall info record and its Cloudinary cover image.
 *       **Access:** SUPER_ADMIN only
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       200:
 *         description: Hall info deleted
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
// ============================================================================
// FACILITIES
// ============================================================================

/**
 * @swagger
 * /api/admin/facilities:
 *   post:
 *     tags: [Admin - Facilities]
 *     summary: Create a facility
 *     description: |
 *       Slug must be unique. Image uploaded to Cloudinary under `hallmate/facilities/`.
 *       **Access:** SUPER_ADMIN, PROVOST
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/AdminFacilityBody'
 *     responses:
 *       201:
 *         description: Facility created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       409:
 *         description: Slug already in use
 *
 * /api/admin/facilities/{id}:
 *   patch:
 *     tags: [Admin - Facilities]
 *     summary: Update a facility
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/AdminFacilityBody'
 *     responses:
 *       200:
 *         description: Facility updated
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       409:
 *         description: Slug already in use
 *
 *   delete:
 *     tags: [Admin - Facilities]
 *     summary: Delete a facility
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       200:
 *         description: Facility deleted
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */

// ============================================================================
// FAQ
// ============================================================================

/**
 * @swagger
 * /api/admin/faq:
 *   post:
 *     tags: [Admin - FAQ]
 *     summary: Create a FAQ entry
 *     description: |
 *       **Access:** SUPER_ADMIN, PROVOST
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AdminFAQBody'
 *     responses:
 *       201:
 *         description: FAQ created
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *
 * /api/admin/faq/{id}:
 *   patch:
 *     tags: [Admin - FAQ]
 *     summary: Update a FAQ entry
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AdminFAQBody'
 *     responses:
 *       200:
 *         description: FAQ updated
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *
 *   delete:
 *     tags: [Admin - FAQ]
 *     summary: Delete a FAQ entry
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       200:
 *         description: FAQ deleted
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */

// ============================================================================
// DINING
// ============================================================================

/**
 * @swagger
 * /api/admin/dining:
 *   post:
 *     tags: [Admin - Dining]
 *     summary: Create dining info
 *     description: |
 *       mealPlan and weeklyMenu are JSON strings (multipart/form-data limitation).
 *       **Access:** SUPER_ADMIN, PROVOST
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/AdminDiningBody'
 *     responses:
 *       201:
 *         description: Dining info created
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *
 * /api/admin/dining/{id}:
 *   patch:
 *     tags: [Admin - Dining]
 *     summary: Update dining info
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/AdminDiningBody'
 *     responses:
 *       200:
 *         description: Dining info updated
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *
 *   delete:
 *     tags: [Admin - Dining]
 *     summary: Delete dining info
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       200:
 *         description: Dining info deleted
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
// ============================================================================
// ACHIEVEMENTS
// ============================================================================

/**
 * @swagger
 * /api/admin/achievements:
 *   post:
 *     tags: [Admin - Achievements]
 *     summary: Create an achievement
 *     description: |
 *       **Access:** SUPER_ADMIN, PROVOST
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/AdminAchievementBody'
 *     responses:
 *       201:
 *         description: Achievement created
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *
 * /api/admin/achievements/{id}:
 *   patch:
 *     tags: [Admin - Achievements]
 *     summary: Update an achievement
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/AdminAchievementBody'
 *     responses:
 *       200:
 *         description: Achievement updated
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *
 *   delete:
 *     tags: [Admin - Achievements]
 *     summary: Delete an achievement
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       200:
 *         description: Achievement deleted
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */

// ============================================================================
// NOTICES
// ============================================================================

/**
 * @swagger
 * /api/admin/notices:
 *   post:
 *     tags: [Admin - Notices]
 *     summary: Create a notice
 *     description: |
 *       Slug must be unique. Setting isPublished to "true" auto-sets publishedAt
 *       to now if publishedAt is not explicitly provided.
 *       **Access:** SUPER_ADMIN, PROVOST
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/AdminNoticeBody'
 *     responses:
 *       201:
 *         description: Notice created
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       409:
 *         description: Slug already in use
 *
 * /api/admin/notices/{id}:
 *   patch:
 *     tags: [Admin - Notices]
 *     summary: Update a notice
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/AdminNoticeBody'
 *     responses:
 *       200:
 *         description: Notice updated
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       409:
 *         description: Slug already in use
 *
 *   delete:
 *     tags: [Admin - Notices]
 *     summary: Delete a notice
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       200:
 *         description: Notice deleted
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
// ============================================================================
// EVENTS
// ============================================================================

/**
 * @swagger
 * /api/admin/events:
 *   post:
 *     tags: [Admin - Events]
 *     summary: Create an event
 *     description: |
 *       Slug must be unique.
 *       **Access:** SUPER_ADMIN, PROVOST
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/AdminEventBody'
 *     responses:
 *       201:
 *         description: Event created
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       409:
 *         description: Slug already in use
 *
 * /api/admin/events/{id}:
 *   patch:
 *     tags: [Admin - Events]
 *     summary: Update an event
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/AdminEventBody'
 *     responses:
 *       200:
 *         description: Event updated
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       409:
 *         description: Slug already in use
 *
 *   delete:
 *     tags: [Admin - Events]
 *     summary: Delete an event
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       200:
 *         description: Event deleted
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */

// ============================================================================
// GALLERY
// ============================================================================

/**
 * @swagger
 * /api/admin/gallery:
 *   post:
 *     tags: [Admin - Gallery]
 *     summary: Create a gallery item
 *     description: |
 *       Image is required on create.
 *       **Access:** SUPER_ADMIN, PROVOST
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/AdminGalleryItemBody'
 *     responses:
 *       201:
 *         description: Gallery item created
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *
 * /api/admin/gallery/{id}:
 *   patch:
 *     tags: [Admin - Gallery]
 *     summary: Update a gallery item
 *     description: |
 *       Image is optional on update. If provided, the old Cloudinary asset is deleted first.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/AdminGalleryItemBody'
 *     responses:
 *       200:
 *         description: Gallery item updated
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *
 *   delete:
 *     tags: [Admin - Gallery]
 *     summary: Delete a gallery item and its Cloudinary image
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       200:
 *         description: Gallery item deleted
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
