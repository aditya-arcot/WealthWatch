export interface PlaidApiRequest {
    id: number
    userId?: number | null
    itemId?: number | null
    timestamp: Date
    duration: number
    method: string
    params: object
    response?: object | null
    errorCode?: string | null
    errorType?: string | null
    errorMessage?: string | null
    errorResponse?: object | null
    errorStack?: string | null
}

// most common error codes for products in use
// https://plaid.com/docs/errors/

export enum PlaidGeneralErrorCodeEnum {
    // all products
    RateLimitExceeded = 'RATE_LIMIT_EXCEEDED',
    InternalServerError = 'INTERNAL_SERVER_ERROR',

    // Item-based products
    ItemLoginRequired = 'ITEM_LOGIN_REQUIRED',
    ProductsNotSupported = 'PRODUCTS_NOT_SUPPORTED',
    NoAccounts = 'NO_ACCOUNTS',
    AccessNotGranted = 'ACCESS_NOT_GRANTED',
    AdditionalConsentRequired = 'ADDITIONAL_CONSENT_REQUIRED',
    InstitutionNotResponding = 'INSTITUTION_NOT_RESPONDING',
    InstitutionDown = 'INSTITUTION_DOWN',
}
