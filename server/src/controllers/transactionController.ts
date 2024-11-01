import { Request, Response } from 'express'
import {
    fetchActiveItemsWithUserId,
    modifyItemTransactionsLastRefreshedWithPlaidId,
} from '../database/itemQueries.js'
import {
    fetchPaginatedActiveTransactionsAndCountsWithUserIdAndFilters,
    modifyTransactionCustomCategoryIdWithPlaidId,
    modifyTransactionCustomNameWithPlaidId,
    modifyTransactionNoteWithPlaidId,
} from '../database/transactionQueries.js'
import { HttpError } from '../models/error.js'
import {
    parseNumberArrayOrUndefinedFromParam,
    parseNumberOrUndefinedFromParam,
} from '../utils/format.js'
import { logger } from '../utils/logger.js'
import { refreshItemTransactions } from './itemController.js'

export const getUserTransactions = async (req: Request, res: Response) => {
    logger.debug('getting transactions')

    const userId = req.session.user?.id
    if (userId === undefined) throw new HttpError('missing user id', 400)

    const searchQuery = req.query['searchQuery']
    if (typeof searchQuery !== 'undefined' && typeof searchQuery !== 'string')
        throw new HttpError('invalid search query', 400)

    const startDate = req.query['startDate']
    if (typeof startDate !== 'undefined' && typeof startDate !== 'string')
        throw new HttpError('invalid start date', 400)

    const endDate = req.query['endDate']
    if (typeof endDate !== 'undefined' && typeof endDate !== 'string')
        throw new HttpError('invalid end date', 400)

    const minAmount = parseNumberOrUndefinedFromParam(
        req.query['minAmount'],
        true
    )
    const maxAmount = parseNumberOrUndefinedFromParam(
        req.query['maxAmount'],
        true
    )
    if (
        minAmount !== undefined &&
        maxAmount !== undefined &&
        minAmount > maxAmount
    ) {
        throw new HttpError('invalid amount range', 400)
    }
    const categoryId = parseNumberArrayOrUndefinedFromParam(
        req.query['categoryId']
    )
    const accountId = parseNumberArrayOrUndefinedFromParam(
        req.query['accountId']
    )
    const limit = parseNumberOrUndefinedFromParam(req.query['limit'], true)
    const offset = parseNumberOrUndefinedFromParam(req.query['offset'], true)

    const transactions =
        await fetchPaginatedActiveTransactionsAndCountsWithUserIdAndFilters(
            userId,
            searchQuery,
            startDate,
            endDate,
            minAmount,
            maxAmount,
            categoryId,
            accountId,
            limit,
            offset
        )
    return res.json(transactions)
}

export const updateTransactionCustomName = async (
    req: Request,
    res: Response
) => {
    logger.debug('updating transaction custom name')

    const plaidTransactionId = req.params['plaidTransactionId']
    if (typeof plaidTransactionId !== 'string')
        throw new HttpError('missing or invalid Plaid transaction id', 400)

    const customName = req.body.customName
    if (customName !== null && typeof customName !== 'string')
        throw new HttpError('missing or invalid name', 400)

    await modifyTransactionCustomNameWithPlaidId(plaidTransactionId, customName)

    return res.status(204).send()
}

export const updateTransactionCustomCategoryId = async (
    req: Request,
    res: Response
) => {
    logger.debug('updating transaction custom category id')

    const plaidTransactionId = req.params['plaidTransactionId']
    if (typeof plaidTransactionId !== 'string')
        throw new HttpError('missing or invalid Plaid transaction id', 400)

    const customCategoryId = req.body.customCategoryId
    if (customCategoryId !== null && typeof customCategoryId !== 'number')
        throw new HttpError('missing or invalid category id', 400)

    await modifyTransactionCustomCategoryIdWithPlaidId(
        plaidTransactionId,
        customCategoryId
    )

    return res.status(204).send()
}

export const updateTransactionNote = async (req: Request, res: Response) => {
    logger.debug('updating transaction note')

    const plaidTransactionId = req.params['plaidTransactionId']
    if (typeof plaidTransactionId !== 'string')
        throw new HttpError('missing or invalid Plaid transaction id', 400)

    const note = req.body.note
    if (note !== null && typeof note !== 'string')
        throw new HttpError('missing or invalid note', 400)

    await modifyTransactionNoteWithPlaidId(plaidTransactionId, note)

    return res.status(204).send()
}

export const refreshUserTransactions = async (req: Request, res: Response) => {
    logger.debug('refreshing transactions')

    const userId = req.session.user?.id
    if (userId === undefined) throw new HttpError('missing user id', 400)

    const items = await fetchActiveItemsWithUserId(userId)
    await Promise.all(
        items.map(async (item) => {
            if (await refreshItemTransactions(item)) {
                await modifyItemTransactionsLastRefreshedWithPlaidId(
                    item.plaidId,
                    new Date()
                )
            }
        })
    )

    return res.status(204).send()
}
