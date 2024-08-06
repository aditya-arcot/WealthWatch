import { Request, Response } from 'express'
import { fetchActiveItemsByUserId } from '../database/itemQueries.js'
import {
    fetchActiveTransactionsByUserId,
    updateTransactionCustomNameById,
} from '../database/transactionQueries.js'
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

export const updateTransactionCustomName = async (
    req: Request,
    res: Response
) => {
    logger.debug('updating transaction custom name')

    const transactionId: string | undefined = req.params['transactionId']
    if (!transactionId) throw new HttpError('missing transaction id', 400)

    const name: string | null | undefined = req.body.name
    if (name === undefined) throw new HttpError('missing name', 400)

    try {
        const t = await updateTransactionCustomNameById(transactionId, name)
        if (!t) throw Error('transaction not updated')
        return res.status(204).send()
    } catch (error) {
        logger.error(error)
        throw Error('failed to update transaction custom name')
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
