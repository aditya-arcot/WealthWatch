import { Request, Response } from 'express'
import { fetchActiveItemsWithUserId } from '../database/itemQueries.js'
import { removeUserWithId } from '../database/userQueries.js'
import { HttpError } from '../models/error.js'
import { logger } from '../utils/logger.js'
import { logout } from './authController.js'
import { removeDeactivateItem } from './itemController.js'

export const getCurrentUser = (req: Request, res: Response) => {
    logger.debug('getting current user')
    return res.send(req.session.user)
}

export const deleteCurrentUser = async (req: Request, res: Response) => {
    logger.debug('deleting current user')

    const user = req.session.user
    if (!user) throw new HttpError('missing user', 400)

    const items = await fetchActiveItemsWithUserId(user.id)
    await Promise.all(
        items.map(async (item) => {
            await removeDeactivateItem(item)
        })
    )

    logger.debug('deleting user')
    await removeUserWithId(user.id)
    return logout(req, res)
}
