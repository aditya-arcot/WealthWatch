import express from 'express'
import {
    createSandboxItem,
    deactivateAllItems,
    deleteAllUsers,
    fireSandboxWebhook,
    forceRefreshItemTransactions,
    resetSandboxItemLogin,
    syncItemBalances,
    syncItemInvestments,
    syncItemTransactions,
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
 * /dev/item:
 *   post:
 *     summary: Create an item (Chase)
 *     tags: [Dev]
 *     responses:
 *       202:
 *         description: Created the item, queued item syncs
 */
router.route('/item').post(catchAsync(createSandboxItem))

/**
 * @swagger
 * /dev/item/refresh-transactions:
 *   post:
 *     summary: Refresh an item's transactions (ignore cooldown)
 *     tags: [Dev]
 *     parameters:
 *       - in: query
 *         name: plaidItemId
 *         schema:
 *           type: string
 *         required: true
 *         description: The Plaid item id
 *     responses:
 *       204:
 *         description: Refreshed the item's transactions
 */
router
    .route('/item/refresh-transactions')
    .post(catchAsync(forceRefreshItemTransactions))

/**
 * @swagger
 * /dev/item/refresh-investments:
 *   post:
 *     summary: Refresh an item's investments (ignore cooldown)
 *     tags: [Dev]
 *     parameters:
 *       - in: query
 *         name: plaidItemId
 *         schema:
 *           type: string
 *         required: true
 *         description: The Plaid item id
 *     responses:
 *       204:
 *         description: Refreshed the item's investments
 */
router
    .route('/item/refresh-investments')
    .post(catchAsync(forceRefreshItemTransactions))

/**
 * @swagger
 * /dev/item/sync-transactions:
 *   post:
 *     summary: Sync an item's transactions
 *     tags: [Dev]
 *     parameters:
 *       - in: query
 *         name: plaidItemId
 *         schema:
 *           type: string
 *         required: true
 *         description: The Plaid item id
 *     responses:
 *       202:
 *         description: Queued sync transactions
 */
router.route('/item/sync-transactions').post(catchAsync(syncItemTransactions))

/**
 * @swagger
 * /dev/item/sync-investments:
 *   post:
 *     summary: Sync an item's investments
 *     tags: [Dev]
 *     parameters:
 *       - in: query
 *         name: plaidItemId
 *         schema:
 *           type: string
 *         required: true
 *         description: The Plaid item id
 *     responses:
 *       202:
 *         description: Queued sync investments
 */
router.route('/item/sync-investments').post(catchAsync(syncItemInvestments))

/**
 * @swagger
 * /dev/item/sync-balances:
 *   post:
 *     summary: Sync an item's balances
 *     tags: [Dev]
 *     parameters:
 *       - in: query
 *         name: plaidItemId
 *         schema:
 *           type: string
 *         required: true
 *         description: The Plaid item id
 *     responses:
 *       202:
 *         description: Queued sync balances
 */
router.route('/item/sync-balances').post(catchAsync(syncItemBalances))

/**
 * @swagger
 * /dev/item/reset-login:
 *   post:
 *     summary: Reset an item login
 *     tags: [Dev]
 *     parameters:
 *       - in: query
 *         name: plaidItemId
 *         schema:
 *           type: string
 *         required: true
 *         description: The Plaid item id
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
 *         name: plaidItemId
 *         schema:
 *           type: string
 *         required: true
 *         description: The Plaid item id
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
