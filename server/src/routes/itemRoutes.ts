import express from 'express'
import {
    getUserItems,
    refreshItemTransactions,
    updateActiveItemsWebhook,
} from '../controllers/itemController.js'
import { catchAsync } from '../utils/catchAsync.js'
import { authenticate } from '../utils/middleware.js'

const router = express.Router()

/**
 * @swagger
 * tags:
 *   name: Items
 *   description: Items management
 */

/**
 * @swagger
 * /items:
 *   get:
 *     summary: Retrieve the logged in user's items
 *     tags: [Items]
 *     responses:
 *       200:
 *         description: Retrieved the logged in user's items
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Item'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.route('/').get(authenticate, catchAsync(getUserItems))

/**
 * @swagger
 * /items/update-webhook:
 *   post:
 *     summary: Update webhook for active items
 *     tags: [Items]
 *     responses:
 *       204:
 *         description: Updated webhook for active items
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router
    .route('/update-webhook')
    .post(authenticate, catchAsync(updateActiveItemsWebhook))

/**
 * @swagger
 * /items/:itemId/refresh-transactions:
 *   post:
 *     summary: Refresh an item's transactions
 *     tags: [Items]
 *     parameters:
 *       - in: path
 *         name: itemId
 *         schema:
 *           type: string
 *         required: true
 *         description: The item ID
 *     responses:
 *       204:
 *         description: Refreshed the item's transactions
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router
    .route('/:itemId/refresh-transactions')
    .post(authenticate, catchAsync(refreshItemTransactions))

export default router
