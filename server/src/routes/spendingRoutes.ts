import express from 'express'
import {
    getUserCategorySummaries,
    getUserSpendingCategoryTotals,
} from '../controllers/spendingController.js'
import { catchAsync } from '../utils/catchAsync.js'
import { authenticate } from '../utils/middleware.js'

const router = express.Router()

/**
 * @swagger
 * tags:
 *   name: Spending
 *   description: Spending management
 */

/**
 * @swagger
 * /spending/category-summaries:
 *   get:
 *     summary: Retrieve the logged in user's category summaries
 *     tags: [Spending]
 *     parameters:
 *       - $ref: '#/components/parameters/StartDate'
 *       - $ref: '#/components/parameters/EndDate'
 *     responses:
 *       200:
 *         description: Retrieved a list of the logged in user's category summaries
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/CategorySummary'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router
    .route('/category-summaries')
    .get(authenticate, catchAsync(getUserCategorySummaries))

/**
 * @swagger
 * /spending/category-totals:
 *   get:
 *     summary: Retrieve the logged in user's spending category totals by date
 *     tags: [Spending]
 *     parameters:
 *       - $ref: '#/components/parameters/StartDate'
 *       - $ref: '#/components/parameters/EndDate'
 *     responses:
 *       200:
 *         description: Retrieved a list of the logged in user's spending category totals by date
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SpendingCategoryTotals'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router
    .route('/category-totals')
    .get(authenticate, catchAsync(getUserSpendingCategoryTotals))

export default router
