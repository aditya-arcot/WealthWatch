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
