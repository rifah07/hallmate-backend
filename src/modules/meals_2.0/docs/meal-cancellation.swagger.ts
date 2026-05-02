/**
 * @swagger
 * components:
 *   securitySchemes:
 *     BearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *
 *   schemas:
 *     CancelMealInput:
 *       type: object
 *       required:
 *         - dates
 *         - mealTypes
 *       properties:
 *         dates:
 *           type: array
 *           minItems: 1
 *           maxItems: 30
 *           description: Array of dates to cancel (YYYY-MM-DD format)
 *           items:
 *             type: string
 *             format: date
 *             example: "2026-04-25"
 *         mealTypes:
 *           type: array
 *           minItems: 1
 *           description: Which meals to cancel
 *           example: ["breakfast", "lunch"]
 *           items:
 *             type: string
 *             enum: [breakfast, lunch, dinner]
 *         reason:
 *           type: string
 *           maxLength: 200
 *           example: "Going home for the weekend"
 *
 *     CancellationResponse:
 *       type: object
 *       properties:
 *         successful:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *                 example: "2026-04-25"
 *               meals:
 *                 type: array
 *                 example: ["breakfast", "lunch"]
 *                 items:
 *                   type: string
 *                   enum: [breakfast, lunch, dinner]
 *         failed:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *               reason:
 *                 type: string
 *                 example: "Cancellation deadline passed for breakfast on Fri Apr 24 2026"
 *         totalProcessed:
 *           type: integer
 *           example: 3
 *
 *     ReactivateMealInput:
 *       type: object
 *       required:
 *         - dates
 *         - mealTypes
 *       properties:
 *         dates:
 *           type: array
 *           minItems: 1
 *           items:
 *             type: string
 *             format: date
 *         mealTypes:
 *           type: array
 *           minItems: 1
 *           items:
 *             type: string
 *             enum: [breakfast, lunch, dinner]
 *
 *     StudentMealStatus:
 *       type: object
 *       properties:
 *         studentId:
 *           type: string
 *           format: uuid
 *         studentName:
 *           type: string
 *           example: "Fatema Ahmed"
 *         date:
 *           type: string
 *           format: date
 *           example: "2026-04-25"
 *         meals:
 *           type: object
 *           properties:
 *             breakfast:
 *               type: object
 *               properties:
 *                 active:
 *                   type: boolean
 *                   example: true
 *                 cancelled:
 *                   type: boolean
 *                   example: false
 *                 cancellationDeadline:
 *                   type: string
 *                   format: date-time
 *                   example: "2026-04-24T07:00:00Z"
 *             lunch:
 *               type: object
 *               properties:
 *                 active:
 *                   type: boolean
 *                   example: false
 *                 cancelled:
 *                   type: boolean
 *                   example: true
 *                 cancellationDeadline:
 *                   type: string
 *                   format: date-time
 *                   example: "2026-04-24T13:00:00Z"
 *             dinner:
 *               type: object
 *               properties:
 *                 active:
 *                   type: boolean
 *                   example: true
 *                 cancelled:
 *                   type: boolean
 *                   example: false
 *                 cancellationDeadline:
 *                   type: string
 *                   format: date-time
 *                   example: "2026-04-24T20:00:00Z"
 *
 *     MealPlanningReport:
 *       type: object
 *       properties:
 *         date:
 *           type: string
 *           format: date
 *           example: "2026-04-25"
 *         breakfast:
 *           type: object
 *           properties:
 *             totalStudents:
 *               type: integer
 *               example: 200
 *             activeMeals:
 *               type: integer
 *               example: 180
 *             cancelled:
 *               type: integer
 *               example: 20
 *             cancellationRate:
 *               type: number
 *               format: float
 *               example: 10.0
 *         lunch:
 *           type: object
 *           properties:
 *             totalStudents:
 *               type: integer
 *               example: 200
 *             activeMeals:
 *               type: integer
 *               example: 185
 *             cancelled:
 *               type: integer
 *               example: 15
 *             cancellationRate:
 *               type: number
 *               format: float
 *               example: 7.5
 *         dinner:
 *           type: object
 *           properties:
 *             totalStudents:
 *               type: integer
 *               example: 200
 *             activeMeals:
 *               type: integer
 *               example: 195
 *             cancelled:
 *               type: integer
 *               example: 5
 *             cancellationRate:
 *               type: number
 *               format: float
 *               example: 2.5
 *         byFloor:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               floor:
 *                 type: integer
 *                 example: 3
 *               breakfast:
 *                 type: integer
 *                 example: 45
 *               lunch:
 *                 type: integer
 *                 example: 43
 *               dinner:
 *                 type: integer
 *                 example: 47
 *
 *     BulkCancelInput:
 *       type: object
 *       required:
 *         - studentIds
 *         - dates
 *         - mealTypes
 *         - reason
 *       properties:
 *         studentIds:
 *           type: array
 *           minItems: 1
 *           items:
 *             type: string
 *             format: uuid
 *         dates:
 *           type: array
 *           minItems: 1
 *           items:
 *             type: string
 *             format: date
 *         mealTypes:
 *           type: array
 *           minItems: 1
 *           items:
 *             type: string
 *             enum: [breakfast, lunch, dinner]
 *         reason:
 *           type: string
 *           minLength: 10
 *           example: "Hall closed for renovation"
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
 *             code:
 *               type: string
 */
