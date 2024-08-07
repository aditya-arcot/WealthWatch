import { Webhook } from '../models/webhook.js'
import { constructInsertQueryParamsPlaceholder, runQuery } from './index.js'

export const insertWebhook = async (
    webhook: Webhook
): Promise<Webhook | undefined> => {
    const values: unknown[] = [webhook.timestamp, webhook.data]

    const rowCount = 1
    const paramCount = values.length
    const query = `
        INSERT INTO webhooks (
            timestamp,
            data
        )
        VALUES ${constructInsertQueryParamsPlaceholder(rowCount, paramCount)}
        RETURNING *
    `

    const rows = (await runQuery<Webhook>(query, values)).rows
    if (!rows[0]) return
    return rows[0]
}
