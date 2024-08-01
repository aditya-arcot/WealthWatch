import { Job } from '../models/job.js'
import { runQuery } from './index.js'

export const insertJob = async (job: Job): Promise<Job | undefined> => {
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
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
    `
    const rows: DbJob[] = (
        await runQuery(query, [
            job.queueName,
            job.jobId,
            job.jobName,
            job.success,
            job.data,
            job.errorName,
            job.errorMessage,
            job.errorStack,
        ])
    ).rows
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
