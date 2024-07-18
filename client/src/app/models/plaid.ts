export interface LinkEvent {
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
