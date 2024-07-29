import { Request, Response } from 'express'
import { HttpError } from '../models/httpError.js'
import { retrieveItemsByUserId } from '../models/item.js'
import { logger } from '../utils/logger.js'

export const getItemsByUser = async (req: Request, res: Response) => {
    logger.debug('getting items')

    const userId: number | undefined = req.session.user?.id
    if (!userId) throw new HttpError('missing user id', 400)

    try {
        const items = await retrieveItemsByUserId(userId)
        return res.send(items)
    } catch (error) {
        logger.error(error)
        throw Error('failed to get items')
    }
}
