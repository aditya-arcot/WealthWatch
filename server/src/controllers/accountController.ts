import { Request, Response } from 'express'
import { fetchActiveAccountsByUserId } from '../database/accountQueries.js'
import { HttpError } from '../models/error.js'
import { logger } from '../utils/logger.js'

export const getUserAccounts = async (req: Request, res: Response) => {
    logger.debug('getting accounts')

    const userId = req.session.user?.id
    if (userId === undefined) throw new HttpError('missing user id', 400)

    const accounts = await fetchActiveAccountsByUserId(userId)
    return res.json(accounts)
}
