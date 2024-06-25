export interface Alert {
    id: string
    type: AlertType
    message: string
    subtext?: string[]
}

export enum AlertType {
    Success,
    Error,
}
