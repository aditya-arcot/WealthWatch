import {
    constructInsertQueryParamsPlaceholder,
    runQuery,
} from '@database/index.js'
import { AccessRequest, AccessRequestStatusEnum } from '@wealthwatch-shared'

export const insertAccessRequest = async (
    req: AccessRequest
): Promise<void> => {
    const values: unknown[] = [
        req.email,
        req.firstName,
        req.lastName,
        req.statusId,
        req.accessCode,
        req.reviewer,
    ]

    const rowCount = 1
    const paramCount = values.length
    const query = `
        INSERT INTO access_requests (
            email,
            first_name,
            last_name,
            status_id,
            access_code,
            reviewer
        )
        VALUES ${constructInsertQueryParamsPlaceholder(rowCount, paramCount)}
    `
    await runQuery(query, values)
}

export const fetchAccessRequests = async (): Promise<AccessRequest[]> => {
    const query = `
        SELECT *
        FROM access_requests
        ORDER BY update_timestamp DESC, id
    `
    const rows = (await runQuery<DbAccessRequest>(query)).rows
    return rows.map(mapDbAccessRequest)
}

export const fetchAccessRequestByEmail = async (
    email: string
): Promise<AccessRequest | undefined> => {
    const query = `
        SELECT *
        FROM access_requests
        WHERE email = $1
        LIMIT 1
    `
    const rows = (await runQuery<DbAccessRequest>(query, [email])).rows
    if (!rows[0]) return
    return mapDbAccessRequest(rows[0])
}

export const fetchAccessRequestByAccessCode = async (
    accessCode: string
): Promise<AccessRequest | undefined> => {
    const query = `
        SELECT *
        FROM access_requests
        WHERE access_code = $1
        LIMIT 1
    `
    const rows = (await runQuery<DbAccessRequest>(query, [accessCode])).rows
    if (!rows[0]) return
    return mapDbAccessRequest(rows[0])
}

export const modifyAccessRequestStatusById = async (
    id: number,
    statusId: number
): Promise<void> => {
    const query = `
        UPDATE access_requests
        SET status_id = $2
        WHERE id = $1
    `
    await runQuery(query, [id, statusId])
}

export const modifyAccessRequestStatusAccessCodeAndReviewerById = async (
    id: number,
    statusId: number,
    accessCode: string | null,
    reviewer: string | null
): Promise<void> => {
    const values: unknown[] = [id, statusId, accessCode, reviewer]
    const query = `
        UPDATE access_requests
        SET status_id = $2, access_code = $3, reviewer = $4
        WHERE id = $1
    `
    await runQuery(query, values)
}

/* eslint-disable @typescript-eslint/naming-convention */
interface DbAccessRequest {
    id: number
    email: string
    first_name: string
    last_name: string
    status_id: AccessRequestStatusEnum
    access_code: string | null
    reviewer: string | null
    create_timestamp: Date
    update_timestamp: Date
}
/* eslint-enable @typescript-eslint/naming-convention */

const mapDbAccessRequest = (req: DbAccessRequest): AccessRequest => ({
    id: req.id,
    email: req.email,
    firstName: req.first_name,
    lastName: req.last_name,
    statusId: req.status_id,
    accessCode: req.access_code,
    reviewer: req.reviewer,
    createTimestamp: req.create_timestamp,
    updateTimestamp: req.update_timestamp,
})
