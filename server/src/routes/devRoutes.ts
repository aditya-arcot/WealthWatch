import express, { Request, Response } from 'express'
import { retrieveItemsByUserId } from '../models/plaid.js'
import { deleteUser, retrieveUsers } from '../models/user.js'
import { removeItem } from '../services/plaidService.js'
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
 *     summary: Delete all users
 *     tags: [Dev]
 *     responses:
 *       204:
 *         description: All users deleted
 */
router.route('/users').delete(
    catchAsync(async (_req: Request, res: Response) => {
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

        return res.status(204).send()
    })
)

// TODO - plaid sandbox routes
// create public token
// reset login
// fire webhook

export default router
