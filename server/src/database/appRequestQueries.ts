import { AppRequest } from '../models/appRequest.js'
import { constructInsertQueryParamsPlaceholder, runQuery } from './index.js'

export const insertAppRequest = async (
    request: AppRequest
): Promise<AppRequest | undefined> => {
    const values: unknown[] = [
        request.requestId,
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
    ]

    const rowCount = 1
    const paramCount = values.length
    const query = `
        INSERT INTO app_requests (
            request_id,
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
        VALUES ${constructInsertQueryParamsPlaceholder(rowCount, paramCount)}
        RETURNING *
    `

    const rows = (await runQuery<DbAppRequest>(query, values)).rows
    if (!rows[0]) return
    return mapDbAppRequest(rows[0])
}

interface DbAppRequest {
    id: number
    request_id: string
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
    requestId: dbAppRequest.request_id,
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
