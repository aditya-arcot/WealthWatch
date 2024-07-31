import express from 'express'
import {
    createSandboxItem,
    deactivateAllItems,
    deleteAllUsers,
    fireSandboxWebhook,
    resetSandboxItemLogin,
    syncItem,
} from '../controllers/devController.js'
import { catchAsync } from '../utils/catchAsync.js'

const router = express.Router()

/**
 * @swagger
 * tags:
 *   name: Dev
 *   description: Dev management
 */

/**
 * @swagger
 * /dev/users:
 *   delete:
 *     summary: Delete all users and deactivate all items
 *     tags: [Dev]
 *     responses:
 *       204:
 *         description: Deleted all users and deactivated all items
 */
router.route('/users').delete(catchAsync(deleteAllUsers))

/**
 * @swagger
 * /dev/items:
 *   delete:
 *     summary: Deactivate all items
 *     tags: [Dev]
 *     responses:
 *       204:
 *         description: Deactivated all items
 */
router.route('/items').delete(catchAsync(deactivateAllItems))

/**
 * @swagger
 * /dev/item/sync:
 *   post:
 *     summary: Sync an item
 *     tags: [Dev]
 *     parameters:
 *       - in: query
 *         name: itemId
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       202:
 *         description: Queued the item for sync
 */
router.route('/item/sync').post(catchAsync(syncItem))

/**
 * @swagger
 * /dev/item:
 *   post:
 *     summary: Create an item (Chase)
 *     tags: [Dev]
 *     responses:
 *       204:
 *         description: Created the item, queued it for sync
 */
router.route('/item').post(catchAsync(createSandboxItem))

/**
 * @swagger
 * /dev/item/reset-login:
 *   post:
 *     summary: Reset an item login
 *     tags: [Dev]
 *     parameters:
 *       - in: query
 *         name: itemId
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       204:
 *         description: Reset the item login
 */
router.route('/item/reset-login').post(catchAsync(resetSandboxItemLogin))
/**
 * @swagger
 * /dev/webhook:
 *   post:
 *     summary: Fire a webhook
 *     tags: [Dev]
 *     parameters:
 *       - in: query
 *         name: itemId
 *         schema:
 *           type: string
 *         required: true
 *         description: The item id
 *       - in: query
 *         name: code
 *         schema:
 *           type: string
 *         required: true
 *         description: The webhook code
 *     responses:
 *       204:
 *         description: Fired the webhook
 */
router.route('/webhook').post(catchAsync(fireSandboxWebhook))

export default router
