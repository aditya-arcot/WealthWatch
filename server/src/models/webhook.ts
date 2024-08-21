export interface Webhook {
    id: number
    timestamp: Date
    data: {
        webhook_type: string
        webhook_code: string
        item_id?: string
    }
}

export enum WebhookTypeEnum {
    Transactions = 'TRANSACTIONS',
}

export enum TransactionsWebhookCodeEnum {
    SyncUpdatesAvailable = 'SYNC_UPDATES_AVAILABLE',
    RecurringTransactionsUpdate = 'RECURRING_TRANSACTIONS_UPDATE',
    InitialUpdate = 'INITIAL_UPDATE',
    HistoricalUpdate = 'HISTORICAL_UPDATE',
    DefaultUpdate = 'DEFAULT_UPDATE',
    TransactionsRemoved = 'TRANSACTIONS_REMOVED',
}
