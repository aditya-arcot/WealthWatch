import { Request, Response } from 'express'
import { HttpError } from '../models/httpError.js'
import { retrieveItemsByUserId } from '../models/item.js'
import {
    deleteUser,
    retrieveUserByEmail,
    retrieveUserByUsername,
} from '../models/user.js'
import { removeItem } from '../services/plaidService.js'
import { logger } from '../utils/logger.js'
import { logout } from './authController.js'

export const getCurrentUser = (req: Request, res: Response) => {
    logger.debug('getting current user')
    // undefined when not logged in
    return res.send(req.session.user)
}

export const removeCurrentUser = async (req: Request, res: Response) => {
    logger.debug('removing user')

    const user = req.session.user
    if (!user) throw new HttpError('missing user', 400)

    const items = await retrieveItemsByUserId(user.id)
    try {
        await Promise.all(items.map((item) => removeItem(item)))
    } catch (error) {
        // ignore
        logger.error(error)
    }

    try {
        await deleteUser(user.id)
        return logout(req, res)
    } catch (error) {
        logger.error(error)
        throw new HttpError('failed to delete user')
    }
}

export const checkUsernameExists = async (req: Request, res: Response) => {
    logger.debug('checking if user with username exists')

    const username: string | undefined = req.params['username']
    if (!username) throw new HttpError('missing username', 400)

    try {
        const user = await retrieveUserByUsername(username)
        return res.send(!!user)
    } catch (error) {
        logger.error(error)
        throw new HttpError('failed to check if username exists')
    }
}

export const checkEmailExists = async (req: Request, res: Response) => {
    logger.debug('checking if user with email exists')

    const email: string | undefined = req.params['email']
    if (!email) throw new HttpError('missing email', 400)

    try {
        const user = await retrieveUserByEmail(email)
        return res.send(!!user)
    } catch (error) {
        logger.error(error)
        throw new HttpError('failed to check if email exists')
    }
}
