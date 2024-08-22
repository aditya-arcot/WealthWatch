import { Request, Response } from 'express'
import {
    fetchActiveNotificationsByUserId,
    updateNotificationsToInactiveByUserIdAndNotificationIds,
    updateNotificationsToReadByUserIdAndNotificationIds,
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

    const ids: number[] | undefined = req.body.ids
    if (ids === undefined) throw new HttpError('missing ids', 400)
    if (ids.length === 0) return res.status(204).send()

    try {
        const n = await updateNotificationsToReadByUserIdAndNotificationIds(
            userId,
            ids
        )
        if (!n) throw Error('notifications not updated')
        return res.status(204).send()
    } catch (error) {
        logger.error(error)
        if (error instanceof HttpError) throw error
        throw Error('failed to update notifications')
    }
}

export const updateUserNotificationsToInactive = async (
    req: Request,
    res: Response
) => {
    logger.debug('updating notifications to inactive')

    const userId: number | undefined = req.session.user?.id
    if (userId === undefined) throw new HttpError('missing user id', 400)

    const ids: number[] | undefined = req.body.ids
    if (ids === undefined) throw new HttpError('missing ids', 400)
    if (ids.length === 0) return res.status(204).send()

    try {
        const n = await updateNotificationsToInactiveByUserIdAndNotificationIds(
            userId,
            ids
        )
        if (!n) throw Error('notifications not updated')
        return res.status(204).send()
    } catch (error) {
        logger.error(error)
        if (error instanceof HttpError) throw error
        throw Error('failed to update notifications')
    }
}
