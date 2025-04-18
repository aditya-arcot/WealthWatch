import { Request, Response } from 'express'
import {
    fetchCategorySummariesByUserIdAndDateRange,
    fetchCategoryTotalsByDateWithUserIdAndDateRange,
} from '../database/spendingQueries.js'
import { fetchActiveTransactionsDateSeriesByUserIdAndDateRange } from '../database/transactionQueries.js'
import { HttpError } from '../models/error.js'
import { logger } from '../utilities/logger.js'

export const getUserCategorySummaries = async (req: Request, res: Response) => {
    logger.debug('getting category summaries')

    const userId = req.session.user?.id
    if (userId === undefined) throw new HttpError('missing user id', 400)

    const startDate = req.query['startDate']
    if (startDate !== undefined && typeof startDate !== 'string')
        throw new HttpError('invalid start date', 400)

    const endDate = req.query['endDate']
    if (endDate !== undefined && typeof endDate !== 'string')
        throw new HttpError('invalid end date', 400)

    const resp = await fetchCategorySummariesByUserIdAndDateRange(
        userId,
        startDate,
        endDate
    )
    return res.json(resp)
}

export const getUserSpendingCategoryTotals = async (
    req: Request,
    res: Response
) => {
    logger.debug('getting spending category totals by date')

    const userId = req.session.user?.id
    if (userId === undefined) throw new HttpError('missing user id', 400)

    const startDate = req.query['startDate']
    if (startDate !== undefined && typeof startDate !== 'string')
        throw new HttpError('invalid start date', 400)

    const endDate = req.query['endDate']
    if (endDate !== undefined && typeof endDate !== 'string')
        throw new HttpError('invalid end date', 400)

    const dates = await fetchActiveTransactionsDateSeriesByUserIdAndDateRange(
        userId,
        startDate,
        endDate
    )
    const totals = await fetchCategoryTotalsByDateWithUserIdAndDateRange(
        userId,
        startDate,
        endDate
    )
    return res.json({ dates, totals })
}
