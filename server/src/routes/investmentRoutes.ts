import express from 'express'
import { getUserHoldings } from '../controllers/investmentController.js'
import { catchAsync } from '../utils/catchAsync.js'

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
router.route('/holdings').get(catchAsync(getUserHoldings))

export default router
