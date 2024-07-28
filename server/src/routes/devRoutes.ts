import express, { Request, Response } from 'express'
import { SandboxItemFireWebhookRequestWebhookCodeEnum } from 'plaid'
import { HttpError } from '../models/httpError.js'
import {
    retrieveItemById,
    retrieveItemByUserIdAndInstitutionId,
    retrieveItemsByUserId,
    updateItemToInactive,
} from '../models/item.js'
import { deleteUser, retrieveUsers, User } from '../models/user.js'
import {
    createPublicToken,
    exchangePublicTokenAndCreateItemAndSync,
    fireWebhook,
    removeItem,
    syncItemData,
} from '../services/plaidService.js'
import { catchAsync } from '../utils/catchAsync.js'
import { logger } from '../utils/logger.js'

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
router.route('/users').delete(
    catchAsync(async (req: Request, res: Response) => {
        logger.debug('deleting all users')

        const users = await retrieveUsers()
        await Promise.all(
            users.map(async (user) => {
                logger.debug({ user }, 'deleting user')
                const items = await retrieveItemsByUserId(user.id)
                await Promise.all(items.map((item) => removeItem(item)))
                await deleteUser(user.id)
            })
        )

        req.session.destroy(() => res.status(204).send())
    })
)

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
router.route('/items').delete(
    catchAsync(async (_req: Request, res: Response) => {
        logger.debug('deactivating all items')

        const users = await retrieveUsers()
        await Promise.all(
            users.map(async (user) => {
                logger.debug({ user }, 'deactivating items for user')

                const items = await retrieveItemsByUserId(user.id)
                await Promise.all(
                    items.map(async (item) => {
                        await removeItem(item)
                        await updateItemToInactive(item.id)
                    })
                )
            })
        )

        return res.status(204).send()
    })
)

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
router.route('/webhook').post(
    catchAsync(async (req: Request, res: Response) => {
        const itemId: string | undefined = req.query['itemId'] as string
        if (!itemId) throw Error('missing item id')

        const item = await retrieveItemById(itemId)
        if (!item) throw Error('item not found')

        const code: string | undefined = req.query['code'] as string
        if (
            !code ||
            typeof code !== 'string' ||
            !Object.values(
                SandboxItemFireWebhookRequestWebhookCodeEnum
            ).includes(code as SandboxItemFireWebhookRequestWebhookCodeEnum)
        ) {
            throw Error('invalid webhook code')
        }
        code
        await fireWebhook(
            item,
            code as SandboxItemFireWebhookRequestWebhookCodeEnum
        )

        return res.status(204).send()
    })
)

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
router.route('/item').post(
    catchAsync(async (req: Request, res: Response) => {
        const user: User | undefined = req.session.user
        if (!user) throw new HttpError('missing user', 400)

        const institutionId = 'ins_56'
        const institutionName = 'Chase'
        const item = await retrieveItemByUserIdAndInstitutionId(
            user.id,
            institutionId
        )
        if (item) throw new HttpError('account already exists', 409)

        const publicToken = await createPublicToken(user, institutionId)
        await exchangePublicTokenAndCreateItemAndSync(
            user.id,
            institutionId,
            institutionName,
            publicToken
        )
        return res.status(204).send()
    })
)

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
router.route('/item-sync').post(
    catchAsync(async (req: Request, res: Response) => {
        const itemId: string | undefined = req.query['itemId'] as string
        if (!itemId) throw new HttpError('missing item id', 400)

        const item = await retrieveItemById(itemId)
        if (!item) throw new HttpError('item not found', 404)

        await syncItemData(item)
        return res.status(204).send()
    })
)

// TODO - reset item login
// https://plaid.com/docs/api/sandbox/#sandboxitemreset_login

export default router
