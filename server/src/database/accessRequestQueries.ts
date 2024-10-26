import {
    AccessRequest,
    AccessRequestStatusEnum,
} from '../models/accessRequest.js'
import { constructInsertQueryParamsPlaceholder, runQuery } from './index.js'

export const insertAccessRequest = async (
    req: AccessRequest
): Promise<AccessRequest | undefined> => {
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
        RETURNING *
    `

    const rows = (await runQuery<DbAccessRequest>(query, values)).rows
    if (!rows[0]) return
    return mapDbAccessRequest(rows[0])
}

export const fetchAccessRequestWithEmail = async (
    email: string
): Promise<AccessRequest | undefined> => {
    const query = 'SELECT * FROM access_requests WHERE email = $1'
    const rows = (await runQuery<DbAccessRequest>(query, [email])).rows
    if (!rows[0]) return
    return mapDbAccessRequest(rows[0])
}

export const fetchAccessRequestWithAccessCode = async (
    accessCode: string
): Promise<AccessRequest | undefined> => {
    const query = 'SELECT * FROM access_requests WHERE access_code = $1'
    const rows = (await runQuery<DbAccessRequest>(query, [accessCode])).rows
    if (!rows[0]) return
    return mapDbAccessRequest(rows[0])
}

export const fetchAccessRequests = async (): Promise<AccessRequest[]> => {
    const query = `
        SELECT * 
        FROM access_requests
        ORDER BY status_id, email, id
    `
    const rows = (await runQuery<DbAccessRequest>(query)).rows
    return rows.map(mapDbAccessRequest)
}

export const modifyAccessRequestStatusAccessCodeReviewerWithId = async (
    id: number,
    statusId: number,
    accessCode: string | null,
    reviewer: string | null
): Promise<AccessRequest | undefined> => {
    const query = `
        UPDATE access_requests
        SET status_id = $2, access_code = $3, reviewer = $4
        WHERE id = $1
        RETURNING *
    `
    const rows = (
        await runQuery<DbAccessRequest>(query, [
            id,
            statusId,
            accessCode,
            reviewer,
        ])
    ).rows
    if (!rows[0]) return
    return mapDbAccessRequest(rows[0])
}

export const modifyAccessRequestStatusWithId = async (
    id: number,
    statusId: number
): Promise<AccessRequest | undefined> => {
    const query = `
        UPDATE access_requests
        SET status_id = $2
        WHERE id = $1
        RETURNING *
    `
    const rows = (await runQuery<DbAccessRequest>(query, [id, statusId])).rows
    if (!rows[0]) return
    return mapDbAccessRequest(rows[0])
}

interface DbAccessRequest {
    id: number
    email: string
    first_name: string
    last_name: string
    status_id: AccessRequestStatusEnum
    access_code: string | null
    reviewer: string | null
}

const mapDbAccessRequest = (req: DbAccessRequest): AccessRequest => ({
    id: req.id,
    email: req.email,
    firstName: req.first_name,
    lastName: req.last_name,
    statusId: req.status_id,
    accessCode: req.access_code,
    reviewer: req.reviewer,
})
