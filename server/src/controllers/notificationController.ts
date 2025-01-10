import { Request, Response } from 'express'
import { Item } from 'wealthwatch-shared/models/item.js'
import { NotificationTypeEnum } from 'wealthwatch-shared/models/notification.js'
import {
    fetchActiveNotificationsByUserId,
    insertNotification,
    modifyNotificationsToReadByUserId,
    modifyNotificationToInactiveByUserIdAndId,
} from '../database/notificationQueries.js'
import { HttpError } from '../models/error.js'
import { createNotification } from '../models/notification.js'
import { parseNumberOrUndefinedFromParam } from '../utils/format.js'
import { logger } from '../utils/logger.js'

export const getUserNotifications = async (req: Request, res: Response) => {
    logger.debug('getting notifications')

    const userId = req.session.user?.id
    if (userId === undefined) throw new HttpError('missing user id', 400)

    const notifications = await fetchActiveNotificationsByUserId(userId)
    return res.json(notifications)
}

export const updateUserNotificationsToRead = async (
    req: Request,
    res: Response
) => {
    logger.debug('updating notifications to read')

    const userId = req.session.user?.id
    if (userId === undefined) throw new HttpError('missing user id', 400)

    await modifyNotificationsToReadByUserId(userId)

    return res.status(204).send()
}

export const updateUserNotificationToInactive = async (
    req: Request,
    res: Response
) => {
    logger.debug('updating notification to inactive')

    const userId = req.session.user?.id
    if (userId === undefined) throw new HttpError('missing user id', 400)

    const notificationId = parseNumberOrUndefinedFromParam(
        req.params['notificationId']
    )
    if (notificationId === undefined)
        throw new HttpError('missing or invalid notification id', 400)

    await modifyNotificationToInactiveByUserIdAndId(userId, notificationId)

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
        message
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
        message
    )
    return insertNotification(notification)
}
