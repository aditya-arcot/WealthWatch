import { PlaidWebhook } from '@wealthwatch-shared'

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
