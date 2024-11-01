import { Request, Response } from 'express'
import { fetchActiveItemWithUserIdAndId } from '../database/itemQueries.js'
import {
    fetchActiveNotificationsWithUserId,
    insertNotification,
    modifyNotificationsToInactiveWithUserIdItemIdAndTypeId,
    modifyNotificationsToReadWithUserId,
    modifyNotificationToInactiveWithUserIdAndId,
} from '../database/notificationQueries.js'
import { HttpError } from '../models/error.js'
import { Item } from '../models/item.js'
import {
    createNotification,
    NotificationTypeEnum,
} from '../models/notification.js'
import { logger } from '../utils/logger.js'

export const getUserNotifications = async (req: Request, res: Response) => {
    logger.debug('getting notifications')

    const userId = req.session.user?.id
    if (userId === undefined) throw new HttpError('missing user id', 400)

    const notifications = await fetchActiveNotificationsWithUserId(userId)
    return res.json(notifications)
}

export const updateUserNotificationsToRead = async (
    req: Request,
    res: Response
) => {
    logger.debug('updating notifications to read')

    const userId = req.session.user?.id
    if (userId === undefined) throw new HttpError('missing user id', 400)

    await modifyNotificationsToReadWithUserId(userId)

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

    await modifyNotificationToInactiveWithUserIdAndId(userId, notificationId)

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

    const item = await fetchActiveItemWithUserIdAndId(userId, itemId)
    if (!item) throw new HttpError('item not found', 404)

    const notificationTypeId = req.body.notificationTypeId
    if (typeof notificationTypeId !== 'number')
        throw new HttpError('invalid notification type', 400)

    const typeEnum = notificationTypeId as NotificationTypeEnum
    if (!Object.values(NotificationTypeEnum).includes(typeEnum)) {
        throw new HttpError('invalid notification type', 400)
    }

    await modifyNotificationsToInactiveWithUserIdItemIdAndTypeId(
        userId,
        itemId,
        notificationTypeId
    )

    return res.status(204).send()
}

export const insertInfoNotification = (item: Item, message: string) => {
    logger.debug(
        {
            itemId: item.id,
            message,
        },
        'inserting info notification'
    )
    const notification = createNotification(
        NotificationTypeEnum.Info,
        item,
        message
    )
    return insertNotification(notification)
}

export const insertLinkUpdateNotification = (item: Item, message: string) => {
    logger.debug(
        {
            itemId: item.id,
            message,
        },
        'inserting link update notification'
    )
    const notification = createNotification(
        NotificationTypeEnum.LinkUpdate,
        item,
        message,
        true
    )
    return insertNotification(notification)
}

export const insertLinkUpdateWithAccountsNotification = (
    item: Item,
    message: string
) => {
    logger.debug(
        {
            itemId: item.id,
            message,
        },
        'inserting link update with accounts notification'
    )
    const notification = createNotification(
        NotificationTypeEnum.LinkUpdateWithAccounts,
        item,
        message,
        true
    )
    return insertNotification(notification)
}
