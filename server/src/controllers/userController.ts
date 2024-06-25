import { Request, Response } from 'express'
import { HttpError } from '../models/httpError.js'
import { getAllUsers } from '../models/user.js'
import { logger } from '../utils/logger.js'

export const getCurrentUser = (req: Request, res: Response) => {
    logger.debug('getting current user')
    // undefined when not logged in
    return res.send(req.session.user)
}

export const getUsers = async (_req: Request, res: Response) => {
    logger.debug('getting users')
    try {
        const users = await getAllUsers()
        return res.send(users)
    } catch (error) {
        throw new HttpError('failed to get users', 500)
    }
}
