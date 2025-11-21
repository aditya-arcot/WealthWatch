import { logout, removeDeactivateItem } from '@controllers'
import { fetchActiveItemsByUserId, removeUserById } from '@database'
import { HttpError } from '@models'
import { logger } from '@utilities'
import { Request, Response } from 'express'

export const getCurrentUser = (req: Request, res: Response) => {
    logger.debug('getting current user')
    res.json(req.session.user)
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
