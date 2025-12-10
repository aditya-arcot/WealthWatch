import { NotificationTypeEnum } from '../enums/index.js'

export interface Notification {
    id: number
    typeId: NotificationTypeEnum
    userId: number
    itemId: number | null
    message: string
    persistent: boolean
    read: boolean
    active: boolean
}
