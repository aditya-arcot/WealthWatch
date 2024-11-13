import { Request, Response } from 'express'
import { fetchActiveItemsByUserId } from '../database/itemQueries.js'
import { removeUserById } from '../database/userQueries.js'
import { HttpError } from '../models/error.js'
import { logger } from '../utils/logger.js'
import { logout } from './authController.js'
import { removeDeactivateItem } from './itemController.js'

export const getCurrentUser = (req: Request, res: Response) => {
    logger.debug('getting current user')
    return res.json(req.session.user)
}

export const deleteCurrentUser = async (req: Request, res: Response) => {
    logger.debug('deleting current user')

    const user = req.session.user
    if (!user) throw new HttpError('missing user', 400)

    const items = await fetchActiveItemsByUserId(user.id)
    await Promise.all(
        items.map(async (item) => {
            await removeDeactivateItem(item)
        })
    )

    logger.debug('deleting user')
    await removeUserById(user.id)
    return logout(req, res)
}
