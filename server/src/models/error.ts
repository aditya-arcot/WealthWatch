import { capitalizeFirstLetter } from '../utils/format.js'

export class HttpError extends Error {
    status: number
    code?: string

    constructor(message: string, status = 500, code?: string) {
        super(capitalizeFirstLetter(message))
        this.status = status
        if (code) this.code = code
    }
}

export class PlaidApiError extends Error {
    code: string
    type: string
    detail: string

    constructor(code: string, type: string, detail: string) {
        super('Plaid API error')
        this.code = code
        this.type = type
        this.detail = capitalizeFirstLetter(detail)
    }
}

export enum AccessRequestErrorCodeEnum {
    UserExists = 'USER_EXISTS',
    RequestPending = 'REQUEST_PENDING',
    RequestApproved = 'REQUEST_APPROVED',
    RequestRejected = 'REQUEST_REJECTED',
}
