import { Request, Response } from 'express'
import { HttpError } from '../models/httpError.js'
import { fetchTransactionsByUser } from '../models/transaction.js'
import { logger } from '../utils/logger.js'

export const getTransactionsByUser = async (req: Request, res: Response) => {
    logger.debug('getting transactions')
    try {
        if (!req.session.user) {
            throw new HttpError('unauthorized', 401)
        }
        const transactions = await fetchTransactionsByUser(req.session.user.id)
        return res.send(transactions)
    } catch (error) {
        throw new HttpError('failed to get transactions', 500)
    }
}
