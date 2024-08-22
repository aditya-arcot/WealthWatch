import { Request, Response } from 'express'
import {
    fetchActiveNotificationsByUserId,
    updateActiveNotificationsToReadByUserId,
} from '../database/notificationQueries.js'
import { HttpError } from '../models/httpError.js'
import { logger } from '../utils/logger.js'

export const getUserNotifications = async (req: Request, res: Response) => {
    logger.debug('getting notifications')

    const userId: number | undefined = req.session.user?.id
    if (userId === undefined) throw new HttpError('missing user id', 400)

    try {
        const notifications = await fetchActiveNotificationsByUserId(userId)
        return res.send(notifications)
    } catch (error) {
        logger.error(error)
        if (error instanceof HttpError) throw error
        throw Error('failed to get notifications')
    }
}

export const updateUserNotificationsToRead = async (
    req: Request,
    res: Response
) => {
    logger.debug('updating notifications to read')

    const userId: number | undefined = req.session.user?.id
    if (userId === undefined) throw new HttpError('missing user id', 400)

    try {
        const n = await updateActiveNotificationsToReadByUserId(userId)
        if (!n) throw Error('notifications not updated')
        return res.status(204).send()
    } catch (error) {
        logger.error(error)
        if (error instanceof HttpError) throw error
        throw Error('failed to update notifications')
    }
}
