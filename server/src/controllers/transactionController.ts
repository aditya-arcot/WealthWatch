import { Request, Response } from 'express'
import {
    fetchActiveItemsByUserId,
    modifyItemLastRefreshedByPlaidId,
} from '../database/itemQueries.js'
import {
    fetchPaginatedActiveTransactionsByUserIdAndFilters,
    modifyTransactionCustomCategoryIdByPlaidId,
    modifyTransactionCustomNameByPlaidId,
    modifyTransactionNoteByPlaidId,
} from '../database/transactionQueries.js'
import { HttpError } from '../models/error.js'
import { refreshCooldown } from '../models/item.js'
import { plaidTransactionsRefresh } from '../plaid/transactionMethods.js'
import {
    parseNumberArrayOrUndefinedFromQueryParam,
    parseNumberOrUndefinedFromQueryParam,
} from '../utils/format.js'
import { logger } from '../utils/logger.js'

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

    const minAmount = parseNumberOrUndefinedFromQueryParam(
        req.query['minAmount']
    )
    const maxAmount = parseNumberOrUndefinedFromQueryParam(
        req.query['maxAmount']
    )
    const categoryId = parseNumberArrayOrUndefinedFromQueryParam(
        req.query['categoryId']
    )
    const accountId = parseNumberArrayOrUndefinedFromQueryParam(
        req.query['accountId']
    )
    const limit = parseNumberOrUndefinedFromQueryParam(req.query['limit'], true)
    const offset = parseNumberOrUndefinedFromQueryParam(
        req.query['offset'],
        true
    )

    const transactions =
        await fetchPaginatedActiveTransactionsByUserIdAndFilters(
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
    return res.send(transactions)
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

    const transaction = await modifyTransactionCustomNameByPlaidId(
        plaidTransactionId,
        customName
    )
    if (!transaction) throw new HttpError('failed to modify transaction')

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

    const transaction = await modifyTransactionCustomCategoryIdByPlaidId(
        plaidTransactionId,
        customCategoryId
    )
    if (!transaction) throw new HttpError('failed to modify transaction')

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

    const transaction = await modifyTransactionNoteByPlaidId(
        plaidTransactionId,
        note
    )
    if (!transaction) throw new HttpError('failed to modify transaction')

    return res.status(204).send()
}

export const refreshUserTransactions = async (req: Request, res: Response) => {
    logger.debug('refreshing transactions')

    const userId = req.session.user?.id
    if (userId === undefined) throw new HttpError('missing user id', 400)

    const items = await fetchActiveItemsByUserId(userId)
    await Promise.all(
        items.map(async (item) => {
            const lastRefresh = item.lastRefreshed?.getTime() || 0
            if (Date.now() - lastRefresh >= refreshCooldown) {
                await plaidTransactionsRefresh(item)
                await modifyItemLastRefreshedByPlaidId(item.plaidId, new Date())
            } else {
                logger.debug(
                    { id: item.id, lastRefresh },
                    'skipping item refresh (cooldown)'
                )
            }
        })
    )

    return res.status(204).send()
}
