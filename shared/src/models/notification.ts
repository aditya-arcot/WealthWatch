import { NotificationTypeEnum } from '@enums'

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
