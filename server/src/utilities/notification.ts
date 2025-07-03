import { Item, NotificationTypeEnum } from '@wealthwatch-shared'

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
