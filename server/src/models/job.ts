export interface Job {
    id: number
    jobId?: string | null
    type: string
    success: boolean
    data?: object | null
    errorName?: string | null
    errorMessage?: string | null
    errorStack?: string | null
}
