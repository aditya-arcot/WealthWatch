import { Job } from '../models/job.js'
import { runQuery } from './index.js'

export const insertJob = async (job: Job): Promise<Job | undefined> => {
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
    if (!rows[0]) return
    return mapDbJob(rows[0])
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
