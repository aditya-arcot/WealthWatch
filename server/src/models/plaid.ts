import { runQuery } from '../utils/database.js'

export interface PlaidLinkEvent {
    id: number
    userId: number
    timestamp: Date
    type: string
    sessionId: string
    requestId?: string | null
    institutionId?: string | null
    institutionName?: string | null
    publicToken?: string | null
    status?: string | null
    errorType?: string | null
    errorCode?: string | null
    errorMessage?: string | null
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

export const createPlaidLinkEvent = async (
    event: PlaidLinkEvent
): Promise<PlaidLinkEvent | null> => {
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
    if (!rows[0]) return null
    return mapDbLinkEvent(rows[0])
}

export interface PlaidApiRequest {
    id: number
    userId?: number | null
    itemId?: number | null
    timestamp: Date
    duration: number
    method: string
    params: object
    response?: object | null
    errorName?: string | null
    errorMessage?: string | null
    errorStack?: string | null
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

export const createPlaidApiRequest = async (
    request: PlaidApiRequest
): Promise<PlaidApiRequest | null> => {
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
    const rows: DbPlaidApiRequest[] = (
        await runQuery(query, [
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
    if (!rows[0]) return null
    return mapDbPlaidApiRequest(rows[0])
}

export interface Webhook {
    id: number
    timestamp: Date
    data: object
}

export const createWebhook = async (
    webhook: Webhook
): Promise<Webhook | null> => {
    const query = `
        INSERT INTO webhooks (
            timestamp, 
            data
        )
        VALUES ($1, $2)
        RETURNING *
    `
    const rows: Webhook[] = (
        await runQuery(query, [webhook.timestamp, webhook.data])
    ).rows
    if (!rows[0]) return null
    return rows[0]
}
