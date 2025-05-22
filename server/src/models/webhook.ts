export interface PlaidWebhook {
    /* eslint-disable @typescript-eslint/naming-convention */
    webhook_type: string
    webhook_code: string
    item_id?: string
    error?: string
    /* eslint-enable @typescript-eslint/naming-convention */
}

export interface Webhook {
    id: number
    timestamp: Date
    type: string
    code: string
    itemId?: string
    error?: string
}

export const mapPlaidWebhook = (plaidWebhook: PlaidWebhook): Webhook => ({
    id: -1,
    timestamp: new Date(),
    type: plaidWebhook.webhook_type,
    code: plaidWebhook.webhook_code,
    ...(plaidWebhook.item_id && { itemId: plaidWebhook.item_id }),
    ...(plaidWebhook.error && { error: plaidWebhook.error }),
})
