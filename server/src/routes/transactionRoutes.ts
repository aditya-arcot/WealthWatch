import express from 'express'
import {
    getUserTransactionsAndCounts,
    refreshUserTransactions,
    updateTransactionCustomCategoryId,
    updateTransactionCustomName,
    updateTransactionNote,
} from '../controllers/transactionController.js'
import { authenticate, catchAsync } from '../utilities/middleware.js'

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
 *     summary: Retrieve the logged-in user's transactions and counts
 *     tags: [Transactions]
 *     parameters:
 *       - $ref: '#/components/parameters/SearchQuery'
 *       - $ref: '#/components/parameters/StartDate'
 *       - $ref: '#/components/parameters/EndDate'
 *       - $ref: '#/components/parameters/MinAmount'
 *       - $ref: '#/components/parameters/MaxAmount'
 *       - $ref: '#/components/parameters/CategoryIds'
 *       - $ref: '#/components/parameters/AccountIds'
 *       - $ref: '#/components/parameters/Limit'
 *       - $ref: '#/components/parameters/Offset'
 *     responses:
 *       200:
 *         description: Retrieved a list of the logged-in user's transactions and counts
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TransactionsAndCounts'
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
 *       - $ref: '#/components/parameters/PlaidTransactionId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CustomName'
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
 *       - $ref: '#/components/parameters/PlaidTransactionId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CustomCategoryId'
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
 *       - $ref: '#/components/parameters/PlaidTransactionId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Note'
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
 *     summary: Refresh the logged-in user's transactions
 *     tags: [Transactions]
 *     responses:
 *       204:
 *         description: Refreshed the logged-in user's transactions
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.route('/refresh').post(authenticate, catchAsync(refreshUserTransactions))

export default router
