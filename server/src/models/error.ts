export class HttpError extends Error {
    status: number
    code?: string

    constructor(message: string, status = 500, code?: string) {
        super(message)
        this.status = status
        if (code) this.code = code
    }
}

export class DatabaseError extends Error {
    // eslint-disable-next-line @typescript-eslint/no-useless-constructor
    constructor(message: string) {
        super(message)
    }
}

export class PlaidApiError extends Error {
    code: string
    detail: string

    constructor(code: string, type: string, detail: string) {
        super(type)
        this.code = code
        this.detail = detail
    }
}
