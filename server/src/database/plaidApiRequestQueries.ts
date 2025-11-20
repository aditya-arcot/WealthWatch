import {
    constructInsertQueryParamsPlaceholder,
    runQuery,
} from '@database/index.js'
import { PlaidApiRequest } from '@models/plaidApiRequest.js'

export const insertPlaidApiRequest = async (
    request: PlaidApiRequest
): Promise<void> => {
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
        INSERT INTO debug.plaid_api_requests (
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
    `

    await runQuery(query, values, null, true)
}
