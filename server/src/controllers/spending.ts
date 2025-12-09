import {
    fetchActiveTransactionsDateSeriesByUserIdAndDateRange,
    fetchCategorySummariesByUserIdAndDateRange,
    fetchCategoryTotalsByDateWithUserIdAndDateRange,
} from '@database'
import { HttpError } from '@models'
import { logger, validate } from '@utilities'
import {
    GetUserCategorySummariesQuerySchema,
    GetUserSpendingCategoryTotalsQuerySchema,
} from '@wealthwatch-shared'
import { Request, Response } from 'express'

export const getUserCategorySummaries = async (req: Request, res: Response) => {
    logger.debug('getting category summaries')

    const userId = req.session.user?.id
    if (userId === undefined) throw new HttpError('missing user id', 400)

    const query = validate(req.query, GetUserCategorySummariesQuerySchema)

    const resp = await fetchCategorySummariesByUserIdAndDateRange(
        userId,
        query.startDate,
        query.endDate
    )
    res.json(resp)
}

export const getUserSpendingCategoryTotals = async (
    req: Request,
    res: Response
) => {
    logger.debug('getting spending category totals by date')

    const userId = req.session.user?.id
    if (userId === undefined) throw new HttpError('missing user id', 400)

    const query = validate(req.query, GetUserSpendingCategoryTotalsQuerySchema)

    const dates = await fetchActiveTransactionsDateSeriesByUserIdAndDateRange(
        userId,
        query.startDate,
        query.endDate
    )
    const totals = await fetchCategoryTotalsByDateWithUserIdAndDateRange(
        userId,
        query.startDate,
        query.endDate
    )
    res.json({ dates, totals })
}
