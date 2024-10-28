import { Request, Response } from 'express'
import { fetchActiveHoldingsWithUserId } from '../database/holdingQueries.js'
import {
    fetchActiveItemsWithUserId,
    modifyItemInvestmentsLastRefreshedWithPlaidId,
} from '../database/itemQueries.js'
import { HttpError } from '../models/error.js'
import { logger } from '../utils/logger.js'
import { refreshItemInvestments } from './itemController.js'

export const getUserHoldings = async (req: Request, res: Response) => {
    logger.debug('getting holdings')

    const userId = req.session.user?.id
    if (userId === undefined) throw new HttpError('missing user id', 400)

    const holdings = await fetchActiveHoldingsWithUserId(userId)
    return res.send(holdings)
}

export const refreshUserInvestments = async (req: Request, res: Response) => {
    logger.debug('refreshing investments')

    const userId = req.session.user?.id
    if (userId === undefined) throw new HttpError('missing user id', 400)

    const items = await fetchActiveItemsWithUserId(userId)
    await Promise.all(
        items.map(async (item) => {
            if (await refreshItemInvestments(item)) {
                await modifyItemInvestmentsLastRefreshedWithPlaidId(
                    item.plaidId,
                    new Date()
                )
            }
        })
    )

    return res.status(204).send()
}
