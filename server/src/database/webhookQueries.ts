import { Webhook } from '../models/webhook.js'
import { runQuery } from './index.js'

export const insertWebhook = async (
    webhook: Webhook
): Promise<Webhook | undefined> => {
    const query = `
        INSERT INTO webhooks (
            timestamp, 
            data
        )
        VALUES ($1, $2)
        RETURNING *
    `
    const rows = (
        await runQuery<Webhook>(query, [webhook.timestamp, webhook.data])
    ).rows
    if (!rows[0]) return
    return rows[0]
}
