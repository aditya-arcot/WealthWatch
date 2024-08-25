export interface Notification {
    id: number
    typeId: number
    userId: number
    itemId: number | null
    message: string
    read: boolean
    active: boolean
}

export enum NotificationTypeEnum {
    Info = 1,
    LinkUpdateRequired,
    LinkUpdateOptional,
    LinkUpdateOptionalNewAccounts,
}

export enum LinkUpdateTypeEnum {
    Required = 'required',
    Optional = 'optional',
    Accounts = 'accounts',
}

export const mapLinkUpdateTypeToNotificationType = (
    type: LinkUpdateTypeEnum
): NotificationTypeEnum => {
    switch (type) {
        case LinkUpdateTypeEnum.Required:
            return NotificationTypeEnum.LinkUpdateRequired
        case LinkUpdateTypeEnum.Optional:
            return NotificationTypeEnum.LinkUpdateOptional
        case LinkUpdateTypeEnum.Accounts:
            return NotificationTypeEnum.LinkUpdateOptionalNewAccounts
    }
}
