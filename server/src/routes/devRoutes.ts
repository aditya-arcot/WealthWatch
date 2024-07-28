import express, { Request, Response } from 'express'
import { SandboxItemFireWebhookRequestWebhookCodeEnum } from 'plaid'
import {
    retrieveItemById,
    retrieveItemsByUserId,
    updateItemToInactive,
} from '../models/item.js'
import { deleteUser, retrieveUsers } from '../models/user.js'
import { fireWebhook, removeItem } from '../services/plaidService.js'
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
                try {
                    await Promise.all(items.map((item) => removeItem(item)))
                } catch (error) {
                    logger.error(error)
                }

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
                        try {
                            await removeItem(item)
                            await updateItemToInactive(item.id)
                        } catch (error) {
                            logger.error(error)
                        }
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

// TODO - plaid sandbox routes
// create public token
// reset login

export default router
