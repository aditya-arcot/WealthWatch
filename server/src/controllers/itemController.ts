import { Request, Response } from 'express'
import {
    fetchActiveItemById,
    fetchActiveItems,
    fetchActiveItemsByUserId,
    modifyItemLastRefreshedByItemId,
} from '../database/itemQueries.js'
import { HttpError } from '../models/httpError.js'
import { refreshCooldown } from '../models/item.js'
import { plaidUpdateItemWebhook } from '../plaid/itemMethods.js'
import { plaidRefreshTransactions } from '../plaid/transactionMethods.js'
import { logger } from '../utils/logger.js'

export const getUserItems = async (req: Request, res: Response) => {
    logger.debug('getting items')

    const userId: number | undefined = req.session.user?.id
    if (!userId) throw new HttpError('missing user id', 400)

    try {
        const items = await fetchActiveItemsByUserId(userId)
        return res.send(items)
    } catch (error) {
        logger.error(error)
        if (error instanceof HttpError) throw error
        throw Error('failed to get items')
    }
}

export const updateActiveItemsWebhook = async (req: Request, res: Response) => {
    logger.debug('updating webhook for active items')

    const url: string | undefined = req.body.url
    if (!url) throw new HttpError('missing url', 400)

    try {
        const items = await fetchActiveItems()
        await Promise.all(
            items.map(async (item) => await plaidUpdateItemWebhook(item, url))
        )
        return res.status(204).send()
    } catch (error) {
        logger.error(error)
        if (error instanceof HttpError) throw error
        throw Error('failed to update webhook')
    }
}

export const refreshItemTransactions = async (req: Request, res: Response) => {
    logger.debug('refreshing item transactions')

    const itemId: string | undefined = req.params['itemId']
    if (!itemId) throw new HttpError('missing item id', 400)

    try {
        const item = await fetchActiveItemById(itemId)
        if (!item) throw new HttpError('item not found', 404)

        const lastRefresh = item.lastRefreshed?.getTime() || 0
        if (Date.now() - lastRefresh < refreshCooldown) {
            throw new HttpError('item refresh cooldown', 429)
        }

        await plaidRefreshTransactions(item)
        await modifyItemLastRefreshedByItemId(item.itemId, new Date())
        return res.status(204).send()
    } catch (error) {
        logger.error(error)
        if (error instanceof HttpError) throw error
        throw Error('failed to refresh item transactions')
    }
}
