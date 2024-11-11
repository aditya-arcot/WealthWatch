import { DatabaseError } from '../models/error.js'
import { Job } from '../models/job.js'
import { constructInsertQueryParamsPlaceholder, runQuery } from './index.js'

export const insertJob = async (job: Job): Promise<void> => {
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
    `

    const result = await runQuery(query, values, null, true)
    if (!result.rowCount) throw new DatabaseError('failed to insert job')
}
