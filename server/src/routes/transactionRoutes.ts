import express from 'express'
import {
    getPaginatedUserTransactions,
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
 * /transactions/paginated:
 *   get:
 *     summary: Retrieve the logged in user's paginated transactions
 *     tags: [Transactions]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         required: true
 *         description: The number of transactions to retrieve
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *         required: true
 *         description: The number of transactions to skip
 *     responses:
 *       200:
 *         description: Retrieved a list of the logged in user's paginated transactions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 transactions:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Transaction'
 *                 limit:
 *                   type: integer
 *                   description: The number of transactions retrieved
 *                 offset:
 *                   type: integer
 *                   description: The number of transactions skipped
 *                 total:
 *                   type: integer
 *                   description: The total number of transactions
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router
    .route('/paginated')
    .get(authenticate, catchAsync(getPaginatedUserTransactions))

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
 *                 type: number
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
