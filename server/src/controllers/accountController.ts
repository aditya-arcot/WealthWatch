import { Request, Response } from 'express'
import { retrieveAccountsByUserId } from '../models/account.js'
import { HttpError } from '../models/httpError.js'
import { logger } from '../utils/logger.js'

export const getAccountsByUser = async (req: Request, res: Response) => {
    logger.debug('getting accounts')

    const userId: number | undefined = req.session.user?.id
    if (!userId) throw new HttpError('missing user id', 400)

    try {
        const accounts = await retrieveAccountsByUserId(userId)
        return res.send(accounts)
    } catch (error) {
        logger.error(error)
        throw new HttpError('failed to get accounts')
    }
}
