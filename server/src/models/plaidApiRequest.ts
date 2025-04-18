export interface PlaidApiRequest {
    id: number
    userId?: number | null
    itemId?: number | null
    timestamp: Date
    duration: number
    method: string
    params: object
    response?: object | null
    errorCode?: string | null
    errorType?: string | null
    errorMessage?: string | null
    errorResponse?: object | null
    errorStack?: string | null
}
