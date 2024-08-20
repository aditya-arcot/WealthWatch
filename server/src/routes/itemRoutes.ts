import express from 'express'
import {
    deactivateItem,
    getUserItems,
    refreshItem,
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
 * /items/{itemId}/refresh:
 *   post:
 *     summary: Refresh an item's transactions and balances
 *     tags: [Items]
 *     parameters:
 *       - in: path
 *         name: itemId
 *         schema:
 *           type: string
 *         required: true
 *         description: The item ID
 *     responses:
 *       202:
 *         description: Refreshed the item's transactions and queued the balance refresh
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.route('/:itemId/refresh').post(authenticate, catchAsync(refreshItem))

/**
 * @swagger
 * /items/{itemId}:
 *   delete:
 *     summary: Deactivate an item
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
 *         description: Deactivated the item
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.route('/:itemId').delete(authenticate, catchAsync(deactivateItem))

export default router
