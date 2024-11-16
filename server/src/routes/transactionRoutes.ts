import express from 'express'
import {
    getUserTransactionsAndCounts,
    refreshUserTransactions,
    updateTransactionCustomCategoryId,
    updateTransactionCustomName,
    updateTransactionNote,
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
 *     summary: Retrieve the logged in user's transactions and counts
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
 *         description: Retrieved a list of the logged in user's transactions and counts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 transactions:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Transaction'
 *                 totalCount:
 *                   type: integer
 *                   description: The total number of transactions
 *                 filteredCount:
 *                   type: integer
 *                   description: The number of filtered transactions
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.route('/').get(authenticate, catchAsync(getUserTransactionsAndCounts))

/**
 * @swagger
 * /transactions/{plaidTransactionId}/name:
 *   patch:
 *     summary: Update a transaction's custom name
 *     tags: [Transactions]
 *     parameters:
 *       - in: path
 *         name: plaidTransactionId
 *         schema:
 *           type: string
 *         required: true
 *         description: The Plaid transaction id
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               customName:
 *                 type: string
 *                 required: true
 *     responses:
 *       204:
 *         description: Updated the transaction's custom name
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router
    .route('/:plaidTransactionId/name')
    .patch(authenticate, catchAsync(updateTransactionCustomName))

/**
 * @swagger
 * /transactions/{plaidTransactionId}/category:
 *   patch:
 *     summary: Update a transaction's custom category id
 *     tags: [Transactions]
 *     parameters:
 *       - in: path
 *         name: plaidTransactionId
 *         schema:
 *           type: string
 *         required: true
 *         description: The Plaid transaction id
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               customCategoryId:
 *                 type: integer
 *                 required: true
 *     responses:
 *       204:
 *         description: Updated the transaction's custom category id
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router
    .route('/:plaidTransactionId/category')
    .patch(authenticate, catchAsync(updateTransactionCustomCategoryId))

/**
 * @swagger
 * /transactions/{plaidTransactionId}/note:
 *   patch:
 *     summary: Update a transaction's note
 *     tags: [Transactions]
 *     parameters:
 *       - in: path
 *         name: plaidTransactionId
 *         schema:
 *           type: string
 *         required: true
 *         description: The Plaid transaction id
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               note:
 *                 type: string
 *                 required: true
 *     responses:
 *       204:
 *         description: Updated the transaction's note
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router
    .route('/:plaidTransactionId/note')
    .patch(authenticate, catchAsync(updateTransactionNote))

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
