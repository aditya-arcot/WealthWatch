import { runQuery } from '../database/index.js'
import { PlaidLinkEvent } from '../models/plaidLinkEvent.js'

export const insertPlaidLinkEvent = async (
    event: PlaidLinkEvent
): Promise<PlaidLinkEvent | undefined> => {
    const query = `
        INSERT INTO plaid_link_events (
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
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *
    `
    const rows: DbPlaidLinkEvent[] = (
        await runQuery(query, [
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
        ])
    ).rows
    if (!rows[0]) return
    return mapDbLinkEvent(rows[0])
}

interface DbPlaidLinkEvent {
    id: number
    user_id: number
    timestamp: Date
    type: string
    session_id: string
    request_id: string | null
    institution_id: string | null
    institution_name: string | null
    public_token: string | null
    status: string | null
    error_type: string | null
    error_code: string | null
    error_message: string | null
}

const mapDbLinkEvent = (dbLinkEvent: DbPlaidLinkEvent): PlaidLinkEvent => ({
    id: dbLinkEvent.id,
    userId: dbLinkEvent.user_id,
    timestamp: dbLinkEvent.timestamp,
    type: dbLinkEvent.type,
    sessionId: dbLinkEvent.session_id,
    requestId: dbLinkEvent.request_id,
    institutionId: dbLinkEvent.institution_id,
    institutionName: dbLinkEvent.institution_name,
    publicToken: dbLinkEvent.public_token,
    status: dbLinkEvent.status,
    errorType: dbLinkEvent.error_type,
    errorCode: dbLinkEvent.error_code,
    errorMessage: dbLinkEvent.error_message,
})
