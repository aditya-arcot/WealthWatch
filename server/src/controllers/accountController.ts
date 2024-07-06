import { Request, Response } from 'express'
import { fetchAccountsByUser } from '../models/account.js'
import { HttpError } from '../models/httpError.js'
import { logger } from '../utils/logger.js'

export const getAccountsByUser = async (req: Request, res: Response) => {
    logger.debug('getting accounts')
    try {
        if (!req.session.user) {
            throw new HttpError('unauthorized', 401)
        }
        const accounts = await fetchAccountsByUser(req.session.user.id)
        return res.send(accounts)
    } catch (error) {
        throw new HttpError('failed to get accounts', 500)
    }
}
