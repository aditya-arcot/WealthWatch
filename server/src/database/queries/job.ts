import { constructInsertQueryParamsPlaceholder, runQuery } from '@database'
import { Job } from '@models'

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
        INSERT INTO debug.jobs (
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

    await runQuery(query, values, null, true)
}
