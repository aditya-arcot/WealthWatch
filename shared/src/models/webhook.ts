export interface PlaidWebhook {
    /* eslint-disable @typescript-eslint/naming-convention */
    webhook_type: string
    webhook_code: string
    item_id?: string
    error?: string | null
    /* eslint-enable @typescript-eslint/naming-convention */
}
