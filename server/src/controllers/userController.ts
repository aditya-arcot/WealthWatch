import { Request, Response } from 'express'
import {
    fetchActiveItemsByUserId,
    modifyItemActiveById,
} from '../database/itemQueries.js'
import {
    fetchUserByEmail,
    fetchUserByUsername,
    removeUserById,
} from '../database/userQueries.js'
import { HttpError } from '../models/httpError.js'
import { plaidItemRemove } from '../plaid/itemMethods.js'
import { logger } from '../utils/logger.js'
import { logout } from './authController.js'

export const getCurrentUser = (req: Request, res: Response) => {
    logger.debug('getting current user')
    // undefined when not logged in
    return res.send(req.session.user)
}

export const deleteCurrentUser = async (req: Request, res: Response) => {
    logger.debug('deleting current user')

    const user = req.session.user
    if (!user) throw new HttpError('missing user', 400)

    logger.debug('unlinking & deactivating items')
    const items = await fetchActiveItemsByUserId(user.id)
    try {
        await Promise.all(
            items.map(async (item) => {
                await plaidItemRemove(item)
                await modifyItemActiveById(item.id, false)
            })
        )
    } catch (error) {
        // ignore
        logger.error(error)
    }

    try {
        await removeUserById(user.id)
        return logout(req, res)
    } catch (error) {
        logger.error(error)
        if (error instanceof HttpError) throw error
        throw Error('failed to delete current user')
    }
}

export const checkUsernameExists = async (req: Request, res: Response) => {
    logger.debug('checking if user with username exists')

    const username: string | undefined = req.params['username']
    if (username === undefined) throw new HttpError('missing username', 400)

    try {
        const user = await fetchUserByUsername(username)
        return res.send(!!user)
    } catch (error) {
        logger.error(error)
        if (error instanceof HttpError) throw error
        throw Error('failed to check if user with username exists')
    }
}

export const checkEmailExists = async (req: Request, res: Response) => {
    logger.debug('checking if user with email exists')

    const email: string | undefined = req.params['email']
    if (email === undefined) throw new HttpError('missing email', 400)

    try {
        const user = await fetchUserByEmail(email)
        return res.send(!!user)
    } catch (error) {
        logger.error(error)
        if (error instanceof HttpError) throw error
        throw Error('failed to check if user with email exists')
    }
}
