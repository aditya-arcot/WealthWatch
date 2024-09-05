import { Request, Response } from 'express'
import { fetchActiveItemsWithUserId } from '../database/itemQueries.js'
import {
    fetchActiveNotificationsWithUserId,
    modifyNotificationsToInactiveWithUserIdAndTypeId,
    modifyNotificationsToReadWithUserId,
    modifyNotificationToInactiveWithUserIdAndId,
} from '../database/notificationQueries.js'
import { HttpError } from '../models/error.js'
import { NotificationTypeEnum } from '../models/notification.js'
import { logger } from '../utils/logger.js'

export const getUserNotifications = async (req: Request, res: Response) => {
    logger.debug('getting notifications')

    const userId = req.session.user?.id
    if (userId === undefined) throw new HttpError('missing user id', 400)

    const notifications = await fetchActiveNotificationsWithUserId(userId)
    return res.send(notifications)
}

export const updateUserNotificationsToRead = async (
    req: Request,
    res: Response
) => {
    logger.debug('updating notifications to read')

    const userId = req.session.user?.id
    if (userId === undefined) throw new HttpError('missing user id', 400)

    const notifications = await modifyNotificationsToReadWithUserId(userId)
    if (!notifications) throw new HttpError('failed to modify notifications')

    return res.status(204).send()
}

export const updateUserNotificationToInactive = async (
    req: Request,
    res: Response
) => {
    logger.debug('updating notification to inactive')

    const userId = req.session.user?.id
    if (userId === undefined) throw new HttpError('missing user id', 400)

    const notificationId = req.body.notificationId
    if (typeof notificationId !== 'number')
        throw new HttpError('invalid notification id', 400)

    const notification = await modifyNotificationToInactiveWithUserIdAndId(
        userId,
        notificationId
    )
    if (!notification) throw new HttpError('failed to modify notification')

    return res.status(204).send()
}

export const updateUserNotificationsToInactive = async (
    req: Request,
    res: Response
) => {
    logger.debug('updating notifications of given type to inactive')

    const userId = req.session.user?.id
    if (userId === undefined) throw new HttpError('missing user id', 400)

    const itemId = req.body.itemId
    if (typeof itemId !== 'number') throw new HttpError('invalid item id', 400)

    const items = await fetchActiveItemsWithUserId(userId)
    const item = items.filter((i) => i.id === itemId)[0]
    if (!item) throw new HttpError('item not found', 404)

    const notificationTypeId = req.body.notificationTypeId
    if (typeof notificationTypeId !== 'number')
        throw new HttpError('invalid notification type', 400)

    const typeEnum = notificationTypeId as NotificationTypeEnum
    if (!Object.values(NotificationTypeEnum).includes(typeEnum)) {
        throw new HttpError('invalid notificationtype', 400)
    }

    const notifications =
        await modifyNotificationsToInactiveWithUserIdAndTypeId(
            userId,
            notificationTypeId
        )
    if (!notifications) throw new HttpError('failed to modify notifications')

    return res.status(204).send()
}
