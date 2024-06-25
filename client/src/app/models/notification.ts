export interface Notification {
    id: string
    type: NotificationType
    message: string
    subtext?: string[]
}

export enum NotificationType {
    Success,
    Error,
}
