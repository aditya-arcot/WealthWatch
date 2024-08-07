import { Job } from '../models/job.js'
import { constructInsertQueryParamsPlaceholder, runQuery } from './index.js'

export const insertJob = async (job: Job): Promise<Job | undefined> => {
    const values: unknown[] = [
        job.queueName,
        job.jobId,
        job.jobName,
        job.success,
        job.data,
        job.errorName,
        job.errorMessage,
        job.errorStack,
    ]

    const rowCount = 1
    const paramCount = values.length
    const query = `
        INSERT INTO jobs (
            queue_name,
            job_id,
            job_name,
            success,
            data,
            error_name,
            error_message,
            error_stack
        )
        VALUES ${constructInsertQueryParamsPlaceholder(rowCount, paramCount)}
        RETURNING *
    `

    const rows = (await runQuery<DbJob>(query, values, true)).rows
    if (!rows[0]) return
    return mapDbJob(rows[0])
}

interface DbJob {
    id: number
    queue_name: string
    job_id: string | null
    job_name: string | null
    type: string
    success: boolean
    data: object | null
    error_name: string | null
    error_message: string | null
    error_stack: string | null
}

const mapDbJob = (dbJob: DbJob): Job => ({
    id: dbJob.id,
    queueName: dbJob.queue_name,
    jobId: dbJob.job_id,
    jobName: dbJob.job_name,
    success: dbJob.success,
    data: dbJob.data,
    errorName: dbJob.error_name,
    errorMessage: dbJob.error_message,
    errorStack: dbJob.error_stack,
})
