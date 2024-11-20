export interface AccessRequest {
    id: number
    email: string
    firstName: string
    lastName: string
    statusId: AccessRequestStatusEnum
    accessCode: string | null
    reviewer: string | null
}

export enum AccessRequestStatusEnum {
    Pending = 1,
    Rejected,
    Approved,
    Completed,
}
