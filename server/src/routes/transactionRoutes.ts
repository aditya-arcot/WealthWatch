import express from 'express'
import {
    getUserTransactions,
    refreshUserTransactions,
    updateTransactionCustomCategoryId,
    updateTransactionCustomName,
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
 *     parameters:
 *       - in: query
 *         name: searchQuery
 *         schema:
 *           type: string
 *         description: The search query
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
 *       - in: query
 *         name: minAmount
 *         schema:
 *           type: integer
 *         description: The minimum amount
 *       - in: query
 *         name: maxAmount
 *         schema:
 *           type: integer
 *         description: The maximum amount
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: array
 *           items:
 *             type: integer
 *         description: The category id(s)
 *       - in: query
 *         name: accountId
 *         schema:
 *           type: array
 *           items:
 *             type: integer
 *         description: The account id(s)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: The number of transactions to retrieve
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *         description: The number of transactions to skip
 *     responses:
 *       200:
 *         description: Retrieved a list of the logged in user's transactions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalCount:
 *                   type: integer
 *                   description: The total number of transactions
 *                 filteredCount:
 *                   type: integer
 *                   description: The number of filtered transactions
 *                 transactions:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Transaction'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.route('/').get(authenticate, catchAsync(getUserTransactions))

/**
 * @swagger
 * /transactions/{transactionId}/name:
 *   patch:
 *     summary: Update a transaction's custom name
 *     tags: [Transactions]
 *     parameters:
 *       - in: path
 *         name: transactionId
 *         schema:
 *           type: string
 *         required: true
 *         description: The transaction ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       204:
 *         description: Updated the transaction's custom name
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router
    .route('/:transactionId/name')
    .patch(authenticate, catchAsync(updateTransactionCustomName))

/**
 * @swagger
 * /transactions/{transactionId}/category:
 *   patch:
 *     summary: Update a transaction's custom category id
 *     tags: [Transactions]
 *     parameters:
 *       - in: path
 *         name: transactionId
 *         schema:
 *           type: string
 *         required: true
 *         description: The transaction ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               categoryId:
 *                 type: integer
 *     responses:
 *       204:
 *         description: Updated the transaction's custom category id
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router
    .route('/:transactionId/category')
    .patch(catchAsync(updateTransactionCustomCategoryId))

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
