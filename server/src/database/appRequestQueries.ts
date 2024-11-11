import { AppRequest } from '../models/appRequest.js'
import { constructInsertQueryParamsPlaceholder, runQuery } from './index.js'

export const insertAppRequest = async (request: AppRequest): Promise<void> => {
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
    `

    await runQuery(query, values, null, true)
}
