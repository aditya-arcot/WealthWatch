import { Request, Response } from 'express'
import { HttpError } from '../models/httpError.js'
import {
    fetchUserByEmail,
    fetchUserByUsername,
    fetchUsers,
} from '../models/user.js'
import { logger } from '../utils/logger.js'

export const getCurrentUser = (req: Request, res: Response) => {
    logger.debug('getting current user')
    // undefined when not logged in
    return res.send(req.session.user)
}

export const getUsers = async (_req: Request, res: Response) => {
    logger.debug('getting users')
    try {
        const users = await fetchUsers()
        return res.send(users)
    } catch (error) {
        throw new HttpError('failed to get users', 500)
    }
}

export const checkUsernameExists = async (req: Request, res: Response) => {
    logger.debug('checking if username exists in database')
    try {
        if (!req.params['username']) {
            throw new HttpError('missing username', 400)
        }
        const user = await fetchUserByUsername(req.params['username'])
        return res.send(!!user)
    } catch (error) {
        throw new HttpError('failed to check username', 500)
    }
}

export const checkEmailExists = async (req: Request, res: Response) => {
    logger.debug('checking if email exists in database')
    try {
        if (!req.params['email']) {
            throw new HttpError('missing email', 400)
        }
        const user = await fetchUserByEmail(req.params['email'])
        return res.send(!!user)
    } catch (error) {
        throw new HttpError('failed to check email', 500)
    }
}
