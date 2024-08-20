import { Request, Response } from 'express'
import { insertAccounts } from '../database/accountQueries.js'
import {
    fetchActiveItemById,
    fetchActiveItems,
    fetchActiveItemsByUserId,
    modifyItemActiveById,
    modifyItemLastRefreshedByItemId,
} from '../database/itemQueries.js'
import { HttpError } from '../models/httpError.js'
import { Item, refreshCooldown } from '../models/item.js'
import {
    plaidRefreshBalances,
    plaidUnlinkItem,
    plaidUpdateItemWebhook,
} from '../plaid/itemMethods.js'
import { plaidRefreshTransactions } from '../plaid/transactionMethods.js'
import { queueItemBalancesRefresh } from '../queues/itemQueue.js'
import { logger } from '../utils/logger.js'

export const getUserItems = async (req: Request, res: Response) => {
    logger.debug('getting items')

    const userId: number | undefined = req.session.user?.id
    if (userId === undefined) throw new HttpError('missing user id', 400)

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
    if (url === undefined) throw new HttpError('missing url', 400)

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

export const refreshItem = async (req: Request, res: Response) => {
    logger.debug('refreshing item transactions')

    const itemId: string | undefined = req.params['itemId']
    if (itemId === undefined) throw new HttpError('missing item id', 400)

    const item = await fetchActiveItemById(itemId)
    if (!item) throw new HttpError('item not found', 404)

    try {
        await refreshItemTransactions(item)
        await queueItemBalancesRefresh(item)
        return res.status(202).send()
    } catch (error) {
        logger.error(error)
        if (error instanceof HttpError) throw error
        throw Error('failed to refresh item transactions')
    }
}

export const refreshItemTransactions = async (item: Item) => {
    if (item.lastRefreshed) {
        if (Date.now() - item.lastRefreshed.getTime() < refreshCooldown) {
            throw new HttpError('item refresh cooldown', 429)
        }
    }
    await plaidRefreshTransactions(item)
    await modifyItemLastRefreshedByItemId(item.itemId, new Date())
}

export const refreshItemBalances = async (item: Item) => {
    if (item.lastRefreshed) {
        if (Date.now() - item.lastRefreshed.getTime() < refreshCooldown) {
            throw new HttpError('item refresh cooldown', 429)
        }
    }
    const accounts = await plaidRefreshBalances(item)
    await insertAccounts(accounts)
    await modifyItemLastRefreshedByItemId(item.itemId, new Date())
}

export const deactivateItem = async (req: Request, res: Response) => {
    logger.debug('deactivating item')

    const itemId: string | undefined = req.params['itemId']
    if (itemId === undefined) throw new HttpError('missing item id', 400)

    try {
        const item = await fetchActiveItemById(itemId)
        if (!item) throw new HttpError('item not found', 404)

        await plaidUnlinkItem(item)
        await modifyItemActiveById(item.id, false)
        return res.status(204).send()
    } catch (error) {
        logger.error(error)
        if (error instanceof HttpError) throw error
        throw Error('failed to deactivate item')
    }
}
