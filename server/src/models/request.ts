import { runQuery } from '../utils/database.js'

export interface AppRequest {
    id: number
    userId?: number | null
    timestamp: Date
    duration: number
    method: string
    url: string
    queryParams?: object | null
    routeParams?: object | null
    requestHeaders?: object | null
    requestBody?: string | null
    remoteAddress?: string | null
    remotePort?: number | null
    session?: object | null
    responseStatus: number
    responseHeaders?: object | null
    responseBody?: string | null
}

interface DbAppRequest {
    id: number
    user_id: number | null
    timestamp: Date
    duration: number
    method: string
    url: string
    query_params: object | null
    route_params: object | null
    request_headers: object | null
    request_body: string | null
    remote_address: string | null
    remote_port: number | null
    session: object | null
    response_status: number
    response_headers: object | null
    response_body: string | null
}

const mapDbAppRequest = (dbAppRequest: DbAppRequest): AppRequest => ({
    id: dbAppRequest.id,
    userId: dbAppRequest.user_id,
    timestamp: dbAppRequest.timestamp,
    duration: dbAppRequest.duration,
    method: dbAppRequest.method,
    url: dbAppRequest.url,
    queryParams: dbAppRequest.query_params,
    routeParams: dbAppRequest.route_params,
    requestHeaders: dbAppRequest.request_headers,
    requestBody: dbAppRequest.request_body,
    remoteAddress: dbAppRequest.remote_address,
    remotePort: dbAppRequest.remote_port,
    session: dbAppRequest.session,
    responseStatus: dbAppRequest.response_status,
    responseHeaders: dbAppRequest.response_headers,
    responseBody: dbAppRequest.response_body,
})

export const createAppRequest = async (
    request: AppRequest
): Promise<AppRequest | null> => {
    const query = `
        INSERT INTO app_requests (
            user_id,
            timestamp,
            duration,
            method,
            url,
            query_params,
            route_params,
            request_headers,
            request_body,
            remote_address,
            remote_port,
            session,
            response_status,
            response_headers,
            response_body
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        RETURNING *
    `
    const rows: DbAppRequest[] = (
        await runQuery(query, [
            request.userId,
            request.timestamp,
            request.duration,
            request.method,
            request.url,
            request.queryParams,
            request.routeParams,
            request.requestHeaders,
            request.requestBody,
            request.remoteAddress,
            request.remotePort,
            request.session,
            request.responseStatus,
            request.responseHeaders,
            request.responseBody,
        ])
    ).rows
    if (!rows[0]) return null
    return mapDbAppRequest(rows[0])
}
