export interface AppRequest {
    id: number
    requestId: string
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
