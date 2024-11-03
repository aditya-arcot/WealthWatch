import { Item } from './item.js'

export interface Notification {
    id: number
    typeId: number
    userId: number
    itemId: number | null
    message: string
    persistent: boolean
    read: boolean
    active: boolean
}

export enum NotificationTypeEnum {
    Info = 1,
    LinkUpdate,
    LinkUpdateWithAccounts,
}

export const createNotification = (
    type: NotificationTypeEnum,
    item: Item,
    message: string,
    persistent = false
) => ({
    id: -1,
    typeId: type,
    userId: item.userId,
    itemId: item.id,
    message,
    persistent,
    read: false,
    active: true,
})
