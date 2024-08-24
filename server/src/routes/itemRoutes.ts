import express from 'express'
import {
    deactivateItem,
    getUserItems,
    refreshItem,
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
 * /items/{plaidItemId}/refresh:
 *   post:
 *     summary: Refresh an item's transactions and balances
 *     tags: [Items]
 *     parameters:
 *       - in: path
 *         name: plaidItemId
 *         schema:
 *           type: string
 *         required: true
 *         description: The Plaid item id
 *     responses:
 *       202:
 *         description: Refreshed the item's transactions and queued the balance refresh
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router
    .route('/:plaidItemId/refresh')
    .post(authenticate, catchAsync(refreshItem))

/**
 * @swagger
 * /items/{plaidItemId}:
 *   delete:
 *     summary: Deactivate an item
 *     tags: [Items]
 *     parameters:
 *       - in: path
 *         name: plaidItemId
 *         schema:
 *           type: string
 *         required: true
 *         description: The Plaid item id
 *     responses:
 *       204:
 *         description: Deactivated the item
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.route('/:plaidItemId').delete(authenticate, catchAsync(deactivateItem))

export default router
