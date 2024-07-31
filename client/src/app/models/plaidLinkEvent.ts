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
