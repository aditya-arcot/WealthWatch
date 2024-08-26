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
