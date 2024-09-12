import { Request, Response } from 'express'
import { fetchActiveHoldingsWithUserId } from '../database/holdingQueries.js'
import { HttpError } from '../models/error.js'
import { logger } from '../utils/logger.js'

export const getUserHoldings = async (req: Request, res: Response) => {
    logger.debug('getting holdings')

    const userId = req.session.user?.id
    if (userId === undefined) throw new HttpError('missing user id', 400)

    const holdings = await fetchActiveHoldingsWithUserId(userId)
    return res.send(holdings)
}
