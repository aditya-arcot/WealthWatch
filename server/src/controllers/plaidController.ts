import { Request, Response } from 'express'
import { LinkSessionSuccessMetadata } from 'plaid'
import { HttpError } from '../models/httpError.js'
import { retrieveItemByUserIdAndInstitutionId } from '../models/item.js'
import { createPlaidLinkEvent, PlaidLinkEvent } from '../models/plaid.js'
import {
    createLinkToken,
    exchangePublicTokenAndCreateItemAndSync,
} from '../services/plaidService.js'
import { logger } from '../utils/logger.js'

export const getLinkToken = async (req: Request, res: Response) => {
    logger.debug('creating link token')

    const userId: number | undefined = req.session.user?.id
    const itemId: string | undefined = req.body.itemId

    if (!userId) throw new HttpError('missing user id', 400)

    try {
        const token = await createLinkToken(userId, itemId)
        return res.send({ linkToken: token })
    } catch (error) {
        logger.error(error)
        throw new HttpError('failed to create link token')
    }
}

export const handleLinkEvent = async (req: Request, res: Response) => {
    logger.debug('handling link event')

    const event: PlaidLinkEvent | undefined = req.body.event
    if (!event) throw new HttpError('missing event', 400)

    try {
        const newEvent = await createPlaidLinkEvent(event)
        if (!newEvent) throw Error('event not created')
        return res.status(204).send()
    } catch (error) {
        logger.error(error)
        throw new HttpError('failed to create link event')
    }
}

export const exchangePublicToken = async (req: Request, res: Response) => {
    logger.debug('exchanging public token')

    const userId: number | undefined = req.session.user?.id
    const publicToken: string | undefined = req.body.publicToken
    const metadata: LinkSessionSuccessMetadata | undefined = req.body.metadata
    const institution = metadata?.institution

    if (!userId) throw new HttpError('missing user id', 400)
    if (!publicToken) throw new HttpError('missing public token', 400)
    if (!metadata) throw new HttpError('missing metadata', 400)
    if (!institution || !institution.institution_id || !institution.name)
        throw new HttpError('missing institution info', 400)

    const item = await retrieveItemByUserIdAndInstitutionId(
        userId,
        institution.institution_id
    )
    if (item) throw new HttpError('account already exists', 409)

    try {
        await exchangePublicTokenAndCreateItemAndSync(
            userId,
            institution.institution_id,
            institution.name,
            publicToken
        )
        return res.status(204).send()
    } catch (error) {
        logger.error(error)
        throw new HttpError('failed to exchange public token')
    }
}
