import { Request, Response } from 'express'
import { fetchActiveItemsByUserId } from '../database/itemQueries.js'
import {
    fetchActiveNotificationsByUserId,
    modifyNotificationsToInactiveByUserIdAndTypeId,
    modifyNotificationsToReadByUserId,
} from '../database/notificationQueries.js'
import { HttpError } from '../models/error.js'
import { NotificationTypeEnum } from '../models/notification.js'
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

    const notifications = await modifyNotificationsToReadByUserId(userId)
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

    const itemId = req.body.itemId
    if (typeof itemId !== 'number') throw new HttpError('invalid item id', 400)

    const items = await fetchActiveItemsByUserId(userId)
    const item = items.filter((i) => i.id === itemId)[0]
    if (!item) throw new HttpError('item not found', 404)

    const notificationTypeId = req.body.notificationTypeId
    if (typeof notificationTypeId !== 'number')
        throw new HttpError('invalid notification type', 400)

    const typeEnum = notificationTypeId as NotificationTypeEnum
    if (!Object.values(NotificationTypeEnum).includes(typeEnum)) {
        throw new HttpError('invalid notificationtype', 400)
    }

    const notifications = await modifyNotificationsToInactiveByUserIdAndTypeId(
        userId,
        notificationTypeId
    )
    if (!notifications) throw new HttpError('failed to modify notifications')

    return res.status(204).send()
}
