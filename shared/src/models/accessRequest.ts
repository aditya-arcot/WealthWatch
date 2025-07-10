import { AccessRequestStatusEnum } from 'enums/accessRequest.js'

export interface AccessRequest {
    id: number
    email: string
    firstName: string
    lastName: string
    statusId: AccessRequestStatusEnum
    accessCode: string | null
    reviewer: string | null
    createTimestamp: Date
    updateTimestamp: Date
}
