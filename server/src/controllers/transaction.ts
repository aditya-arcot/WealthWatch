import { refreshItemTransactions } from '@controllers'
import {
    fetchActiveItemsByUserId,
    fetchPaginatedActiveTransactionsAndCountsByUserIdAndFilters,
    modifyItemTransactionsLastRefreshedByPlaidId,
    modifyTransactionCustomCategoryIdByPlaidId,
    modifyTransactionCustomNameByPlaidId,
    modifyTransactionNoteByPlaidId,
} from '@database'
import { HttpError } from '@models'
import { logger, validate } from '@utilities'
import {
    CategoryEnum,
    GetUserTransactionsAndCountsQuerySchema,
    UpdateTransactionCustomCategoryIdBodySchema,
    UpdateTransactionCustomCategoryIdParamsSchema,
    UpdateTransactionCustomNameBodySchema,
    UpdateTransactionCustomNameParamsSchema,
    UpdateTransactionNoteBodySchema,
    UpdateTransactionNoteParamsSchema,
} from '@wealthwatch-shared'
import { Request, Response } from 'express'

export const getUserTransactionsAndCounts = async (
    req: Request,
    res: Response
) => {
    logger.debug('getting transactions')

    const userId = req.session.user?.id
    if (userId === undefined) throw new HttpError('missing user id', 400)

    const query = validate(req.query, GetUserTransactionsAndCountsQuerySchema)

    if (
        query.minAmount !== undefined &&
        query.maxAmount !== undefined &&
        query.minAmount > query.maxAmount
    )
        throw new HttpError('invalid amount range', 400)

    const resp =
        await fetchPaginatedActiveTransactionsAndCountsByUserIdAndFilters(
            userId,
            query.searchQuery,
            query.startDate,
            query.endDate,
            query.minAmount,
            query.maxAmount,
            query.categoryId,
            query.accountId,
            query.limit,
            query.offset
        )
    res.json(resp)
}

export const updateTransactionCustomName = async (
    req: Request,
    res: Response
) => {
    logger.debug('updating transaction custom name')

    const params = validate(req.params, UpdateTransactionCustomNameParamsSchema)
    const body = validate(req.body, UpdateTransactionCustomNameBodySchema)

    await modifyTransactionCustomNameByPlaidId(
        params.plaidTransactionId,
        body.customName
    )

    res.status(204).send()
}

export const updateTransactionCustomCategoryId = async (
    req: Request,
    res: Response
) => {
    logger.debug('updating transaction custom category id')

    const params = validate(
        req.params,
        UpdateTransactionCustomCategoryIdParamsSchema
    )
    const body = validate(req.body, UpdateTransactionCustomCategoryIdBodySchema)

    const customCategoryId = body.customCategoryId as CategoryEnum | null

    await modifyTransactionCustomCategoryIdByPlaidId(
        params.plaidTransactionId,
        customCategoryId
    )

    res.status(204).send()
}

export const updateTransactionNote = async (req: Request, res: Response) => {
    logger.debug('updating transaction note')

    const params = validate(req.params, UpdateTransactionNoteParamsSchema)
    const body = validate(req.body, UpdateTransactionNoteBodySchema)

    await modifyTransactionNoteByPlaidId(params.plaidTransactionId, body.note)

    res.status(204).send()
}

export const refreshUserTransactions = async (req: Request, res: Response) => {
    logger.debug('refreshing transactions')

    const userId = req.session.user?.id
    if (userId === undefined) throw new HttpError('missing user id', 400)

    const items = await fetchActiveItemsByUserId(userId)
    await Promise.all(
        items.map(async (item) => {
            if (await refreshItemTransactions(item)) {
                await modifyItemTransactionsLastRefreshedByPlaidId(
                    item.plaidId,
                    new Date()
                )
            }
        })
    )

    res.status(204).send()
}
