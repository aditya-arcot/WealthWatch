import { AlertTypeEnum } from '../enums/alert'

export interface Alert {
    id: string
    type: AlertTypeEnum
    message: string
    subtext: string[]
}
