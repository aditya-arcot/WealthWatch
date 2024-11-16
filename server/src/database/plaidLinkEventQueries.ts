import {
    constructInsertQueryParamsPlaceholder,
    runQuery,
} from '../database/index.js'
import { PlaidLinkEvent } from '../models/plaidLinkEvent.js'

export const insertPlaidLinkEvent = async (
    event: PlaidLinkEvent
): Promise<void> => {
    const values: unknown[] = [
        event.userId,
        event.timestamp,
        event.type,
        event.sessionId,
        event.requestId,
        event.institutionId,
        event.institutionName,
        event.publicToken,
        event.status,
        event.errorType,
        event.errorCode,
        event.errorMessage,
    ]

    const rowCount = 1
    const paramCount = values.length
    const query = `
        INSERT INTO debug.plaid_link_events (
            user_id,
            timestamp,
            type,
            session_id,
            request_id,
            institution_id,
            institution_name,
            public_token,
            status,
            error_type,
            error_code,
            error_message
        )
        VALUES ${constructInsertQueryParamsPlaceholder(rowCount, paramCount)}
    `

    await runQuery(query, values, null, true)
}
