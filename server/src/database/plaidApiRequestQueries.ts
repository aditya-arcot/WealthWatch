import { PlaidApiRequest } from '../models/plaidApiRequest.js'
import { constructInsertQueryParamsPlaceholder, runQuery } from './index.js'

export const insertPlaidApiRequest = async (
    request: PlaidApiRequest
): Promise<PlaidApiRequest | undefined> => {
    const values: unknown[] = [
        request.userId,
        request.itemId,
        request.timestamp,
        request.duration,
        request.method,
        request.params,
        request.response,
        request.errorCode,
        request.errorType,
        request.errorMessage,
        request.errorResponse,
        request.errorStack,
    ]

    const rowCount = 1
    const paramCount = values.length
    const query = `
        INSERT INTO plaid_api_requests (
            user_id,
            item_id,
            timestamp,
            duration,
            method,
            params,
            response,
            error_code,
            error_type,
            error_message,
            error_response,
            error_stack
        )
        VALUES ${constructInsertQueryParamsPlaceholder(rowCount, paramCount)}
        RETURNING *
    `

    const rows = (await runQuery<DbPlaidApiRequest>(query, values, true)).rows
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
    error_code: string | null
    error_type: string | null
    error_message: string | null
    error_response: object | null
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
    errorCode: dbPlaidApiRequest.error_code,
    errorType: dbPlaidApiRequest.error_type,
    errorMessage: dbPlaidApiRequest.error_message,
    errorResponse: dbPlaidApiRequest.error_response,
    errorStack: dbPlaidApiRequest.error_stack,
})
