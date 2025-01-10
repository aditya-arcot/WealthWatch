export interface ServerError {
    message: string
    code?: string
}

export enum AccessRequestErrorCodeEnum {
    UserExists = 'USER_EXISTS',
    RequestPending = 'REQUEST_PENDING',
    RequestApproved = 'REQUEST_APPROVED',
    RequestRejected = 'REQUEST_REJECTED',
}
