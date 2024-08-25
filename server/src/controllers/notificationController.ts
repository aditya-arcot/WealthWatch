import { Request, Response } from 'express'
import {
    fetchActiveNotificationsByUserId,
    modifyNotificationsActiveByUserIdAndIds,
    modifyNotificationsReadByUserIdAndIds,
} from '../database/notificationQueries.js'
import { HttpError } from '../models/httpError.js'
import { parseNumberArrayFromBodyProp } from '../utils/format.js'
import { logger } from '../utils/logger.js'

export const getUserNotifications = async (req: Request, res: Response) => {
    logger.debug('getting notifications')

    const userId = req.session.user?.id
    if (userId === undefined) throw new HttpError('missing user id', 400)

    const notifications = await fetchActiveNotificationsByUserId(userId)
    return res.send(notifications)
}

export const updateUserNotificationsToRead = async (
    req: Request,
    res: Response
) => {
    logger.debug('updating notifications to read')

    const userId = req.session.user?.id
    if (userId === undefined) throw new HttpError('missing user id', 400)

    const notificationIds = parseNumberArrayFromBodyProp(
        req.body.notificationIds
    )
    if (notificationIds.length === 0) return res.status(204).send()

    const notifications = await modifyNotificationsReadByUserIdAndIds(
        userId,
        notificationIds,
        true
    )
    if (!notifications) throw new HttpError('failed to modify notifications')

    return res.status(204).send()
}

export const updateUserNotificationsToInactive = async (
    req: Request,
    res: Response
) => {
    logger.debug('updating notifications to inactive')

    const userId = req.session.user?.id
    if (userId === undefined) throw new HttpError('missing user id', 400)

    const notificationIds = parseNumberArrayFromBodyProp(
        req.body.notificationIds
    )
    if (notificationIds.length === 0) return res.status(204).send()

    const notifications = await modifyNotificationsActiveByUserIdAndIds(
        userId,
        notificationIds,
        false
    )
    if (!notifications) throw new HttpError('failed to modify notifications')

    return res.status(204).send()
}
