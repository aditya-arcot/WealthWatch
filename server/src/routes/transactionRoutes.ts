import express from 'express'
import {
    getUserTransactions,
    refreshUserTransactions,
} from '../controllers/transactionController.js'
import { catchAsync } from '../utils/catchAsync.js'
import { authenticate } from '../utils/middleware.js'

const router = express.Router()

/**
 * @swagger
 * tags:
 *   name: Transactions
 *   description: Transactions management
 */

/**
 * @swagger
 * /transactions:
 *   get:
 *     summary: Retrieve the logged in user's transactions
 *     tags: [Transactions]
 *     responses:
 *       200:
 *         description: Retrieved a list of the logged in user's transactions
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Transaction'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.route('/').get(authenticate, catchAsync(getUserTransactions))

/**
 * @swagger
 * /transactions/refresh:
 *   post:
 *     summary: Refresh the logged in user's transactions
 *     tags: [Transactions]
 *     responses:
 *       204:
 *         description: Refreshed the logged in user's transactions
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.route('/refresh').post(authenticate, catchAsync(refreshUserTransactions))

export default router
