import {
    fetchAccessRequests,
    modifyAccessRequestStatusAccessCodeAndReviewerById,
} from '@database'
import { HttpError } from '@models'
import { logger, validate } from '@utilities'
import {
    AccessRequestStatusEnum,
    ReviewAccessRequestBodySchema,
    ReviewAccessRequestParamsSchema,
} from '@wealthwatch-shared'
import * as crypto from 'crypto'
import { Request, Response } from 'express'

export const getAccessRequests = async (_req: Request, res: Response) => {
    logger.debug('getting access requests')
    const reqs = await fetchAccessRequests()
    res.json(reqs)
}

export const reviewAccessRequest = async (req: Request, res: Response) => {
    logger.debug('reviewing access request')

    const username = req.session.user?.username
    if (username === undefined) throw new HttpError('missing username', 400)

    const params = validate(req.params, ReviewAccessRequestParamsSchema)
    const body = validate(req.body, ReviewAccessRequestBodySchema)

    const statusId = body.statusId as AccessRequestStatusEnum

    let accessCode: string | null = null
    if (statusId === AccessRequestStatusEnum.Approved)
        accessCode = crypto.randomBytes(4).toString('hex').slice(0, 8)

    await modifyAccessRequestStatusAccessCodeAndReviewerById(
        params.accessRequestId,
        statusId,
        accessCode,
        username
    )
    res.status(204).send()
}
