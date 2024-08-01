export interface Job {
    id: number
    queueName: string
    jobId?: string | null
    jobName?: string | null
    success: boolean
    data?: object | null
    errorName?: string | null
    errorMessage?: string | null
    errorStack?: string | null
}
