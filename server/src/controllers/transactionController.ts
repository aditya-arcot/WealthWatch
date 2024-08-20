import { Request, Response } from 'express'
import {
    fetchActiveItemsByUserId,
    modifyItemLastRefreshedByItemId,
} from '../database/itemQueries.js'
import {
    fetchActiveTransactionsByUserId,
    updateTransactionCustomCategoryIdById,
    updateTransactionCustomNameById,
    updateTransactionNoteById,
} from '../database/transactionQueries.js'
import { HttpError } from '../models/httpError.js'
import { refreshCooldown } from '../models/item.js'
import { plaidTransactionsRefresh } from '../plaid/transactionMethods.js'
import { logger } from '../utils/logger.js'

export const getUserTransactions = async (req: Request, res: Response) => {
    logger.debug('getting transactions')

    const userId: number | undefined = req.session.user?.id
    if (userId === undefined) throw new HttpError('missing user id', 400)

    const searchQuery = req.query['searchQuery'] as string | undefined
    const startDate = req.query['startDate'] as string | undefined
    const endDate = req.query['endDate'] as string | undefined

    const minAmount = req.query['minAmount'] as string | undefined
    let minAmountNum: number | undefined
    if (minAmount !== undefined) {
        minAmountNum = parseFloat(minAmount)
        if (isNaN(minAmountNum)) throw new HttpError('invalid minAmount', 400)
    }

    const maxAmount = req.query['maxAmount'] as string | undefined
    let maxAmountNum: number | undefined
    if (maxAmount !== undefined) {
        maxAmountNum = parseFloat(maxAmount)
        if (isNaN(maxAmountNum)) throw new HttpError('invalid maxAmount', 400)
        if (minAmountNum !== undefined && maxAmountNum < minAmountNum)
            throw new HttpError('maxAmount must be greater than minAmount', 400)
    }

    const categoryId = req.query['categoryId'] as string | string[] | undefined
    let categoryIdNums: number[] | undefined
    if (categoryId !== undefined) {
        if (typeof categoryId === 'string') {
            const idNum = parseInt(categoryId)
            if (isNaN(idNum) || idNum < 1)
                throw new HttpError(`invalid categoryId - ${categoryId}`, 400)
            categoryIdNums = [idNum]
        } else {
            categoryIdNums = categoryId.map((id) => {
                const idNum = parseInt(id)
                if (isNaN(idNum) || idNum < 1)
                    throw new HttpError(`invalid categoryId - ${id}`, 400)
                return idNum
            })
        }
    }

    const accountId = req.query['accountId'] as string | string[] | undefined
    let accountIdNums: number[] | undefined
    if (accountId !== undefined) {
        if (typeof accountId === 'string') {
            const idNum = parseInt(accountId)
            if (isNaN(idNum) || idNum < 1)
                throw new HttpError(`invalid accountId - ${accountId}`, 400)
            accountIdNums = [idNum]
        } else {
            accountIdNums = accountId.map((id) => {
                const idNum = parseInt(id)
                if (isNaN(idNum) || idNum < 1)
                    throw new HttpError(`invalid accountId - ${id}`, 400)
                return idNum
            })
        }
    }

    const limit = req.query['limit'] as string | undefined
    let limitNum: number | undefined
    if (limit !== undefined) {
        limitNum = parseInt(limit)
        if (isNaN(limitNum) || limitNum < 0)
            throw new HttpError('invalid limit', 400)
    }

    const offset = req.query['offset'] as string | undefined
    let offsetNum: number | undefined
    if (offset !== undefined) {
        offsetNum = parseInt(offset)
        if (isNaN(offsetNum) || offsetNum < 0)
            throw new HttpError('invalid offset', 400)
    }

    try {
        const transactions = await fetchActiveTransactionsByUserId(
            userId,
            searchQuery,
            startDate,
            endDate,
            minAmountNum,
            maxAmountNum,
            categoryIdNums,
            accountIdNums,
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
    if (transactionId === undefined)
        throw new HttpError('missing transaction id', 400)

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
    if (transactionId === undefined)
        throw new HttpError('missing transaction id', 400)

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

export const updateTransactionNote = async (req: Request, res: Response) => {
    logger.debug('updating transaction note')

    const transactionId: string | undefined = req.params['transactionId']
    if (transactionId === undefined)
        throw new HttpError('missing transaction id', 400)

    const note: string | null | undefined = req.body.note
    if (note === undefined) throw new HttpError('missing note', 400)

    try {
        const t = await updateTransactionNoteById(transactionId, note)
        if (!t) throw Error('transaction not updated')
        return res.status(204).send()
    } catch (error) {
        logger.error(error)
        if (error instanceof HttpError) throw error
        throw Error('failed to update transaction note')
    }
}

export const refreshUserTransactions = async (req: Request, res: Response) => {
    logger.debug('refreshing transactions')

    const userId: number | undefined = req.session.user?.id
    if (userId === undefined) throw new HttpError('missing user id', 400)

    try {
        const items = await fetchActiveItemsByUserId(userId)
        await Promise.all(
            items.map(async (item) => {
                const lastRefresh = item.lastRefreshed?.getTime() || 0
                if (Date.now() - lastRefresh >= refreshCooldown) {
                    await plaidTransactionsRefresh(item)
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
