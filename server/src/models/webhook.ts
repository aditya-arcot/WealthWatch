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
