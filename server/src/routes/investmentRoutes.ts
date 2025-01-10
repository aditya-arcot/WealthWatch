import express from 'express'
import { refreshUserInvestments } from '../controllers/investmentController.js'
import { catchAsync } from '../utils/catchAsync.js'
import { authenticate } from '../utils/middleware.js'

const router = express.Router()

/**
 * @swagger
 * tags:
 *   name: Investments
 *   description: Investments management
 */

/**
 * @swagger
 * /investments/refresh:
 *   post:
 *     summary: Refresh the logged-in user's investments
 *     tags: [Investments]
 *     responses:
 *       204:
 *         description: Refreshed the logged-in user's investments
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.route('/refresh').post(authenticate, catchAsync(refreshUserInvestments))

export default router
