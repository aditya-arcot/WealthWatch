import { Request, Response } from 'express'
import {
    fetchActiveItems,
    fetchItemsByUserId,
} from '../database/itemQueries.js'
import { HttpError } from '../models/httpError.js'
import { plaidUpdateItemWebhook } from '../plaid/itemMethods.js'
import { logger } from '../utils/logger.js'

export const getUserItems = async (req: Request, res: Response) => {
    logger.debug('getting items')

    const userId: number | undefined = req.session.user?.id
    if (!userId) throw new HttpError('missing user id', 400)

    try {
        const items = await fetchItemsByUserId(userId)
        return res.send(items)
    } catch (error) {
        logger.error(error)
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
        throw Error('failed to update webhook')
    }
}
