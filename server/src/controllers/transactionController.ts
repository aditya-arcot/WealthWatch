import { Request, Response } from 'express'
import { fetchActiveItemsByUserId } from '../database/itemQueries.js'
import { fetchActiveTransactionsByUserId } from '../database/transactionQueries.js'
import { HttpError } from '../models/httpError.js'
import { plaidRefreshTransactions } from '../plaid/transactionMethods.js'
import { logger } from '../utils/logger.js'

export const getUserTransactions = async (req: Request, res: Response) => {
    logger.debug('getting transactions')

    const userId: number | undefined = req.session.user?.id
    if (!userId) throw new HttpError('missing user id', 400)

    try {
        const transactions = await fetchActiveTransactionsByUserId(userId)
        return res.send(transactions)
    } catch (error) {
        logger.error(error)
        throw Error('failed to get transactions')
    }
}

export const refreshUserTransactions = async (req: Request, res: Response) => {
    logger.debug('refreshing transactions')

    const userId: number | undefined = req.session.user?.id
    if (!userId) throw new HttpError('missing user id', 400)

    try {
        const items = await fetchActiveItemsByUserId(userId)
        await Promise.all(
            items.map(async (item) => await plaidRefreshTransactions(item))
        )
        return res.status(204).send()
    } catch (error) {
        logger.error(error)
        throw Error('failed to refresh transactions')
    }
}
