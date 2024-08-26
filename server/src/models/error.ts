import { capitalizeFirstLetter } from '../utils/format.js'

export class HttpError extends Error {
    statusCode: number

    constructor(message: string, statusCode = 500) {
        super(capitalizeFirstLetter(message))
        this.statusCode = statusCode
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
