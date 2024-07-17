import { runQuery } from '../utils/database.js'

export interface PlaidLinkEvent {
    id: number
    userId: number
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
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
    `
    const rows: DbPlaidLinkEvent[] = (
        await runQuery(query, [
            event.userId,
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
    userId: number
    itemId?: number | null
    method: string
    params: object
    response?: object | null
    errorName?: string | null
    errorMessage?: string | null
    errorStack?: string | null
}

export const createPlaidApiRequest = async (
    request: PlaidApiRequest
): Promise<void> => {
    const query = `
        INSERT INTO plaid_api_requests (
            user_id,
            item_id,
            method,
            params,
            response,
            error_name,
            error_message,
            error_stack
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `
    await runQuery(query, [
        request.userId,
        request.itemId,
        request.method,
        request.params,
        request.response,
        request.errorName,
        request.errorMessage,
        request.errorStack,
    ])
}

export interface Item {
    id: number
    userId: number
    itemId: string
    accessToken: string
    institutionId: string
    institutionName: string
    healthy: boolean
    cursor: string | null
}

interface DbItem {
    id: number
    user_id: number
    item_id: string
    access_token: string
    institution_id: string
    institution_name: string
    healthy: boolean
    cursor: string | null
}

const mapDbItem = (dbItem: DbItem): Item => ({
    id: dbItem.id,
    userId: dbItem.user_id,
    itemId: dbItem.item_id,
    accessToken: dbItem.access_token,
    institutionId: dbItem.institution_id,
    institutionName: dbItem.institution_name,
    healthy: dbItem.healthy,
    cursor: dbItem.cursor,
})

export const retrieveItemById = async (
    itemId: string
): Promise<Item | null> => {
    const query = `
        SELECT * 
        FROM items
        WHERE item_id = $1
        `
    const rows: DbItem[] = (await runQuery(query, [itemId])).rows
    if (!rows[0]) return null
    return mapDbItem(rows[0])
}

export const retrieveItemByUserIdAndInstitutionId = async (
    userId: number,
    institutionId: string
): Promise<Item | null> => {
    const query = `
        SELECT * 
        FROM items
        WHERE user_id = $1
            AND institution_id = $2
        `
    const rows: DbItem[] = (await runQuery(query, [userId, institutionId])).rows
    if (!rows[0]) return null
    return mapDbItem(rows[0])
}

export const retrieveItemsByUserId = async (
    userId: number
): Promise<Item[]> => {
    const query = `
        SELECT *
        FROM items
        WHERE user_id = $1
    `
    const rows: DbItem[] = (await runQuery(query, [userId])).rows
    return rows.map(mapDbItem)
}

export const createItem = async (
    userId: number,
    itemId: string,
    accessToken: string,
    institutionId: string,
    institutionName: string,
    healthy: boolean = true,
    cursor?: string
): Promise<Item | null> => {
    const query = `
        INSERT INTO items (
            user_id,
            item_id,
            access_token,
            institution_id,
            institution_name,
            healthy,
            cursor
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
    `
    const rows: DbItem[] = (
        await runQuery(query, [
            userId,
            itemId,
            accessToken,
            institutionId,
            institutionName,
            healthy,
            cursor ?? null,
        ])
    ).rows
    if (!rows[0]) return null
    return mapDbItem(rows[0])
}

export const updateItemCursor = async (
    itemId: string,
    cursor: string | null
) => {
    const query = `
        UPDATE items 
        SET cursor = $1 
        WHERE item_id = $2
    `
    await runQuery(query, [cursor, itemId])
}
