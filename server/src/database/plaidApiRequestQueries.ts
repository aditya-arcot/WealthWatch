import { PlaidApiRequest } from '../models/plaidApiRequest.js'
import { runQuery } from './index.js'

export const insertPlaidApiRequest = async (
    request: PlaidApiRequest
): Promise<PlaidApiRequest | undefined> => {
    const query = `
        INSERT INTO plaid_api_requests (
            user_id,
            item_id,
            timestamp,
            duration,
            method,
            params,
            response,
            error_name,
            error_message,
            error_stack
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
    `
    const rows = (
        await runQuery<DbPlaidApiRequest>(query, [
            request.userId,
            request.itemId,
            request.timestamp,
            request.duration,
            request.method,
            request.params,
            request.response,
            request.errorName,
            request.errorMessage,
            request.errorStack,
        ])
    ).rows
    if (!rows[0]) return
    return mapDbPlaidApiRequest(rows[0])
}

interface DbPlaidApiRequest {
    id: number
    user_id: number | null
    item_id: number | null
    timestamp: Date
    duration: number
    method: string
    params: object
    response: object | null
    error_name: string | null
    error_message: string | null
    error_stack: string | null
}

const mapDbPlaidApiRequest = (
    dbPlaidApiRequest: DbPlaidApiRequest
): PlaidApiRequest => ({
    id: dbPlaidApiRequest.id,
    userId: dbPlaidApiRequest.user_id,
    itemId: dbPlaidApiRequest.item_id,
    timestamp: dbPlaidApiRequest.timestamp,
    duration: dbPlaidApiRequest.duration,
    method: dbPlaidApiRequest.method,
    params: dbPlaidApiRequest.params,
    response: dbPlaidApiRequest.response,
    errorName: dbPlaidApiRequest.error_name,
    errorMessage: dbPlaidApiRequest.error_message,
    errorStack: dbPlaidApiRequest.error_stack,
})
