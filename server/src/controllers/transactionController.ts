import { Request, Response } from 'express'
import { HttpError } from '../models/httpError.js'
import { fetchTransactions } from '../models/transaction.js'
import { logger } from '../utils/logger.js'

export const getTransactions = async (_req: Request, res: Response) => {
    logger.debug('getting transactions')
    try {
        const transactions = await fetchTransactions()
        return res.send(transactions)
    } catch (error) {
        throw new HttpError('failed to get transactions', 500)
    }
}
