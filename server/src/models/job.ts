import { runQuery } from '../utils/database.js'

export enum LogJobType {
    AppRequestLog = 'AppRequest',
    PlaidLinkEventLog = 'PlaidLinkEvent',
    PlaidApiRequestLog = 'PlaidApiRequest',
    WebhookLog = 'Webhook',
}

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

interface DbJob {
    id: number
    job_id: string | null
    type: string
    success: boolean
    data: object | null
    error_name: string | null
    error_message: string | null
    error_stack: string | null
}

const mapDbJob = (dbJob: DbJob): Job => ({
    id: dbJob.id,
    jobId: dbJob.job_id,
    type: dbJob.type,
    success: dbJob.success,
    data: dbJob.data,
    errorName: dbJob.error_name,
    errorMessage: dbJob.error_message,
    errorStack: dbJob.error_stack,
})

const createJob = async (job: Job): Promise<Job | null> => {
    const query = `
        INSERT INTO jobs (
            job_id,
            type,
            success,
            data,
            error_name,
            error_message,
            error_stack
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
    `
    const rows: DbJob[] = (
        await runQuery(query, [
            job.jobId,
            job.type,
            job.success,
            job.data,
            job.errorName,
            job.errorMessage,
            job.errorStack,
        ])
    ).rows
    if (!rows[0]) return null
    return mapDbJob(rows[0])
}

export const createSuccessJob = async (
    jobId: string | undefined,
    type: string,
    data: object
) => {
    return createJob({
        id: -1,
        jobId: jobId ?? null,
        type,
        success: true,
        data,
    })
}

export const createFailureJob = async (
    jobId: string | undefined,
    type: string,
    data: object | null,
    error: Error
) => {
    return createJob({
        id: -1,
        jobId: jobId ?? null,
        type,
        success: false,
        data,
        errorName: error.name,
        errorMessage: error.message,
        errorStack: error.stack ?? null,
    })
}
