import { Request, Response } from 'express'
import { LinkSessionSuccessMetadata } from 'plaid'
import { HttpError } from '../models/httpError.js'
import { createItem } from '../models/plaid.js'
import {
    checkExistingItem,
    createLinkToken,
    exchangePublicTokenForAccessToken,
    syncItemData,
} from '../services/plaidService.js'
import { logger } from '../utils/logger.js'

export const getLinkToken = async (req: Request, res: Response) => {
    logger.debug('creating link token')

    const userId: number | undefined = req.session.user?.id
    const itemId: string | undefined = req.body.itemId

    if (!userId) throw new HttpError('missing user id', 400)

    try {
        const token = await createLinkToken(userId, itemId)
        return res.send(token)
    } catch (error) {
        logger.error(error)
        throw new HttpError('failed to create link token')
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

    if (await checkExistingItem(userId, institution.institution_id)) {
        throw new HttpError('account already exists', 409)
    }

    try {
        const token = await exchangePublicTokenForAccessToken(publicToken)
        const item = await createItem(
            userId,
            token.itemId,
            token.accessToken,
            institution.institution_id,
            institution.name
        )
        if (!item) throw Error('item not created')
        await syncItemData(item)
        return res.send(token)
    } catch (error) {
        logger.error(error)
        throw new HttpError('failed to exchange public token')
    }
}
