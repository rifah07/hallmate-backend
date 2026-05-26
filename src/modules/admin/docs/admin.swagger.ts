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
