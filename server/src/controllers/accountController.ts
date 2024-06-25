import { Request, Response } from 'express'
import { getAllAccounts } from '../models/account.js'
import { HttpError } from '../models/httpError.js'
import { logger } from '../utils/logger.js'

export const getAccounts = async (_req: Request, res: Response) => {
    logger.debug('getting accounts')
    try {
        const accounts = await getAllAccounts()
        return res.send(accounts)
    } catch (error) {
        throw new HttpError('failed to get accounts', 500)
    }
}
