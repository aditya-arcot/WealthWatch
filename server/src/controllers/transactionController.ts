import { Request, Response } from 'express'
import {
    fetchActiveItemsByUserId,
    modifyItemLastRefreshedByItemId,
} from '../database/itemQueries.js'
import {
    fetchActiveTransactionsByUserId,
    updateTransactionCustomCategoryIdById,
    updateTransactionCustomNameById,
} from '../database/transactionQueries.js'
import { HttpError } from '../models/httpError.js'
import { refreshCooldown } from '../models/item.js'
import { plaidRefreshTransactions } from '../plaid/transactionMethods.js'
import { logger } from '../utils/logger.js'

export const getUserTransactions = async (req: Request, res: Response) => {
    logger.debug('getting transactions')

    const userId: number | undefined = req.session.user?.id
    if (!userId) throw new HttpError('missing user id', 400)

    const searchQuery = req.query['searchQuery'] as string | undefined

    const limit = req.query['limit'] as string | undefined
    let limitNum: number | undefined
    if (limit) {
        limitNum = parseInt(limit)
        if (isNaN(limitNum) || limitNum < 0)
            throw new HttpError('invalid limit', 400)
    }

    const offset = req.query['offset'] as string | undefined
    let offsetNum: number | undefined
    if (offset) {
        offsetNum = parseInt(offset)
        if (isNaN(offsetNum) || offsetNum < 0)
            throw new HttpError('invalid offset', 400)
    }

    try {
        const transactions = await fetchActiveTransactionsByUserId(
            userId,
            searchQuery,
            limitNum,
            offsetNum
        )
        return res.send(transactions)
    } catch (error) {
        logger.error(error)
        if (error instanceof HttpError) throw error
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
        if (error instanceof HttpError) throw error
        throw Error('failed to update transaction custom name')
    }
}

export const updateTransactionCustomCategoryId = async (
    req: Request,
    res: Response
) => {
    logger.debug('updating transaction custom category id')

    const transactionId: string | undefined = req.params['transactionId']
    if (!transactionId) throw new HttpError('missing transaction id', 400)

    const categoryId: number | null | undefined = req.body.categoryId
    if (categoryId === undefined)
        throw new HttpError('missing category id', 400)

    try {
        const t = await updateTransactionCustomCategoryIdById(
            transactionId,
            categoryId
        )
        if (!t) throw Error('transaction not updated')
        return res.status(204).send()
    } catch (error) {
        logger.error(error)
        if (error instanceof HttpError) throw error
        throw Error('failed to update transaction custom category id')
    }
}

export const refreshUserTransactions = async (req: Request, res: Response) => {
    logger.debug('refreshing transactions')

    const userId: number | undefined = req.session.user?.id
    if (!userId) throw new HttpError('missing user id', 400)

    try {
        const items = await fetchActiveItemsByUserId(userId)
        await Promise.all(
            items.map(async (item) => {
                const lastRefresh = item.lastRefreshed?.getTime() || 0
                if (Date.now() - lastRefresh >= refreshCooldown) {
                    await plaidRefreshTransactions(item)
                    await modifyItemLastRefreshedByItemId(
                        item.itemId,
                        new Date()
                    )
                } else {
                    logger.debug(
                        { itemId: item.itemId },
                        'skipping item refresh (cooldown)'
                    )
                }
            })
        )
        return res.status(204).send()
    } catch (error) {
        logger.error(error)
        if (error instanceof HttpError) throw error
        throw Error('failed to refresh transactions')
    }
}
