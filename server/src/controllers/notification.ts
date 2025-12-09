import {
    fetchActiveNotificationsByUserId,
    insertNotification,
    modifyNotificationsToReadByUserId,
    modifyNotificationToInactiveByUserIdAndId,
} from '@database'
import { HttpError } from '@models'
import { createNotification, logger, validate } from '@utilities'
import {
    Item,
    NotificationTypeEnum,
    UpdateUserNotificationToInactiveParamsSchema,
} from '@wealthwatch-shared'
import { Request, Response } from 'express'

export const getUserNotifications = async (req: Request, res: Response) => {
    logger.debug('getting notifications')

    const userId = req.session.user?.id
    if (userId === undefined) throw new HttpError('missing user id', 400)

    const notifications = await fetchActiveNotificationsByUserId(userId)
    res.json(notifications)
}

export const updateUserNotificationsToRead = async (
    req: Request,
    res: Response
) => {
    logger.debug('updating notifications to read')

    const userId = req.session.user?.id
    if (userId === undefined) throw new HttpError('missing user id', 400)

    await modifyNotificationsToReadByUserId(userId)

    res.status(204).send()
}

export const updateUserNotificationToInactive = async (
    req: Request,
    res: Response
) => {
    logger.debug('updating notification to inactive')

    const userId = req.session.user?.id
    if (userId === undefined) throw new HttpError('missing user id', 400)

    const params = validate(
        req.params,
        UpdateUserNotificationToInactiveParamsSchema
    )

    await modifyNotificationToInactiveByUserIdAndId(
        userId,
        params.notificationId
    )

    res.status(204).send()
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
