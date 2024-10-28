import express from 'express'
import {
    getUserHoldings,
    refreshUserInvestments,
} from '../controllers/investmentController.js'
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
 * /investments/holdings:
 *   get:
 *     summary: Retrieve the logged in user's investment holdings
 *     tags: [Investments]
 *     responses:
 *       200:
 *         description: Retrieved the logged in user's investment holdings
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/HoldingWithSecurity'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.route('/holdings').get(authenticate, catchAsync(getUserHoldings))

/**
 * @swagger
 * /investments/refresh:
 *   post:
 *     summary: Refresh the logged in user's investments
 *     tags: [Investments]
 *     responses:
 *       204:
 *         description: Refreshed the logged in user's investments
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.route('/refresh').post(authenticate, catchAsync(refreshUserInvestments))

export default router
