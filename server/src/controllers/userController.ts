import { Request, Response } from 'express'
import { fetchActiveItemsByUserId } from '../database/itemQueries.js'
import {
    fetchUserByEmail,
    fetchUserByUsername,
    removeUserById,
} from '../database/userQueries.js'
import { HttpError } from '../models/httpError.js'
import { logger } from '../utils/logger.js'
import { logout } from './authController.js'
import { deactivateItemMain } from './itemController.js'

export const getCurrentUser = (req: Request, res: Response) => {
    logger.debug('getting current user')
    return res.send(req.session.user)
}

export const deleteCurrentUser = async (req: Request, res: Response) => {
    logger.debug('deleting current user')

    const user = req.session.user
    if (!user) throw new HttpError('missing user', 400)

    const items = await fetchActiveItemsByUserId(user.id)
    await Promise.all(
        items.map(async (item) => {
            await deactivateItemMain(item)
        })
    )

    logger.debug('deleting user')
    await removeUserById(user.id)
    return logout(req, res)
}

export const checkUserExists = async (req: Request, res: Response) => {
    logger.debug('checking if user exists')

    const email = req.body.email
    if (typeof email !== 'string')
        throw new HttpError('missing or invalid email', 400)

    const username = req.body.username
    if (typeof username !== 'string')
        throw new HttpError('missing or invalid username', 400)

    const emailExists = !!(await fetchUserByEmail(email))
    const usernameExists = !!(await fetchUserByUsername(username))
    return res.send({ emailExists, usernameExists })
}
