import express from 'express'
import {
    getUserSpendingTotalAndCountByCategory,
    getUserSpendingTotalByCategoryAndDate,
} from '../controllers/spendingController.js'
import { catchAsync } from '../utils/catchAsync.js'

const router = express.Router()

/**
 * @swagger
 * tags:
 *   name: Spending
 *   description: Spending management
 */

/**
 * @swagger
 * /spending/category:
 *   get:
 *     summary: Retrieve the logged in user's spending total and count by category
 *     tags: [Spending]
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *         description: The start date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *         description: The end date
 *     responses:
 *       200:
 *         description: Retrieved a list of the logged in user's spending total and count by category
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/CategoryTotalAndCount'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router
    .route('/category')
    .get(catchAsync(getUserSpendingTotalAndCountByCategory))

/**
 * @swagger
 * /spending/category-and-date:
 *   get:
 *     summary: Retrieve the logged in user's spending total by category and date
 *     tags: [Spending]
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *         description: The start date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *         description: The end date
 *     responses:
 *       200:
 *         description: Retrieved a list of the logged in user's spending total by category and date
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 dates:
 *                   type: array
 *                   items:
 *                     type: string
 *                     format: date
 *                 totals:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/CategoryTotalByDate'
 */
router
    .route('/category-and-date')
    .get(catchAsync(getUserSpendingTotalByCategoryAndDate))

export default router
