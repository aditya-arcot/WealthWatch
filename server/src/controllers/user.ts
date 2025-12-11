import { logout, removeDeactivateItem } from '@controllers'
import {
    fetchActiveItemsByUserId,
    fetchUserByUsername,
    removeUserById,
} from '@database'
import { HttpError } from '@models'
import { logger } from '@utilities'
import { Request, Response } from 'express'

export const getCurrentUser = async (req: Request, res: Response) => {
    logger.debug('getting current user')

    const sessionUser = req.session.user
    if (!sessionUser) return res.json(undefined)

    const user = await fetchUserByUsername(sessionUser.username)
    if (!user) throw new HttpError('user not found', 404)

    return res.json(user)
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
    logout(req, res)
}
