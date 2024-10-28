import * as crypto from 'crypto'
import { Request, Response } from 'express'
import {
    fetchAccessRequests,
    modifyAccessRequestStatusAccessCodeReviewerWithId,
} from '../database/accessRequestQueries.js'
import { AccessRequestStatusEnum } from '../models/accessRequest.js'
import { HttpError } from '../models/error.js'
import { parseNumberOrUndefinedFromParam } from '../utils/format.js'
import { logger } from '../utils/logger.js'

export const getAccessRequests = async (_req: Request, res: Response) => {
    logger.debug('getting access requests')
    const reqs = await fetchAccessRequests()
    return res.json(reqs)
}

export const reviewAccessRequest = async (req: Request, res: Response) => {
    logger.debug('reviewing access request')

    const accessRequestId = parseNumberOrUndefinedFromParam(
        req.params['requestId']
    )
    if (accessRequestId === undefined)
        throw new HttpError('missing or invalid access request id', 400)

    const statusId = req.body.statusId
    if (statusId === undefined || typeof statusId !== 'number')
        throw new HttpError('missing or invalid status id', 400)

    let accessCode: string | null = null
    if (statusId === AccessRequestStatusEnum.Approved) {
        accessCode = crypto.randomBytes(4).toString('hex').slice(0, 8)
    }

    const username = req.session.user?.username
    if (username === undefined) throw new HttpError('missing username', 400)

    const accessReq = await modifyAccessRequestStatusAccessCodeReviewerWithId(
        accessRequestId,
        statusId,
        accessCode,
        username
    )
    if (!accessReq) throw new HttpError('failed to modify access request')

    return res.status(204).send()
}
