import { Item } from 'wealthwatch-shared/models/item.js'
import { NotificationTypeEnum } from 'wealthwatch-shared/models/notification.js'

export const createNotification = (
    type: NotificationTypeEnum,
    item: Item,
    message: string
) => ({
    id: -1,
    typeId: type,
    userId: item.userId,
    itemId: item.id,
    message,
    persistent: type !== NotificationTypeEnum.Info,
    read: false,
    active: true,
})
