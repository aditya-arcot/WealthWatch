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

export enum PlaidTransactionErrorCodeEnum {
    TransactionsSyncMutationDuringPagination = 'TRANSACTIONS_SYNC_MUTATION_DURING_PAGINATION',
}

export enum PlaidAccountErrorCodeEnum {
    LastUpdatedDatetimeOutOfRange = 'LAST_UPDATED_DATETIME_OUT_OF_RANGE',
}
