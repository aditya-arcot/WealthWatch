export interface Webhook {
    id: number
    timestamp: Date
    data: {
        webhook_type: string
        webhook_code: string
        item_id?: string
        error?: string
    }
}

export enum WebhookTypeEnum {
    Transactions = 'TRANSACTIONS',
    Holdings = 'HOLDINGS',
    Liabilities = 'LIABILITIES',
    Item = 'ITEM',
}

export enum TransactionsWebhookCodeEnum {
    SyncUpdatesAvailable = 'SYNC_UPDATES_AVAILABLE',
    RecurringTransactionsUpdate = 'RECURRING_TRANSACTIONS_UPDATE',
    InitialUpdate = 'INITIAL_UPDATE',
    HistoricalUpdate = 'HISTORICAL_UPDATE',
    DefaultUpdate = 'DEFAULT_UPDATE',
    TransactionsRemoved = 'TRANSACTIONS_REMOVED',
}

export enum HoldingsWebhookCodeEnum {
    DefaultUpdate = 'DEFAULT_UPDATE',
}

export enum LiabilitiesWebhookCodeEnum {
    DefaultUpdate = 'DEFAULT_UPDATE',
}

export enum ItemWebhookCodeEnum {
    Error = 'ERROR',
    LoginRepaired = 'LOGIN_REPAIRED',
    NewAccountsAvailable = 'NEW_ACCOUNTS_AVAILABLE',
    PendingExpiration = 'PENDING_EXPIRATION',
    UserPermissionRevoked = 'USER_PERMISSION_REVOKED',
    UserAccountRevoked = 'USER_ACCOUNT_REVOKED',
    WebhookUpdateAcknowledged = 'WEBHOOK_UPDATE_ACKNOWLEDGED',
}
