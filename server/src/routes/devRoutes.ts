import express from 'express'
import {
    createSandboxItem,
    deactivateItems,
    deleteUsers,
    fireSandboxWebhook,
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
 *     summary: Unregister items, delete users and child data
 *     tags: [Dev]
 *     responses:
 *       204:
 *         description: All users deleted
 */
router.route('/users').delete(catchAsync(deleteUsers))

/**
 * @swagger
 * /dev/items:
 *   delete:
 *     summary: Unregister & deactivate all items
 *     tags: [Dev]
 *     responses:
 *       204:
 *         description: All items deactivated
 */
router.route('/items').delete(catchAsync(deactivateItems))

/**
 * @swagger
 * /dev/webhook:
 *   post:
 *     summary: Fire Plaid webhook
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
 *         description: Webhook fired
 */
router.route('/webhook').post(catchAsync(fireSandboxWebhook))

/**
 * @swagger
 * /dev/item:
 *   post:
 *     summary: Create and sync item
 *     tags: [Dev]
 *     responses:
 *       204:
 *         description: Created and synced item
 */
router.route('/item').post(catchAsync(createSandboxItem))

/**
 * @swagger
 * /dev/item-sync:
 *   post:
 *     summary: Sync item
 *     tags: [Dev]
 *     parameters:
 *       - in: query
 *         name: itemId
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       204:
 *         description: Synced item
 */
router.route('/item-sync').post(catchAsync(syncItem))

// TODO - reset item login
// https://plaid.com/docs/api/sandbox/#sandboxitemreset_login

export default router
