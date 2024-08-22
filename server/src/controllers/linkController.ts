import { Request, Response } from 'express'
import { LinkSessionSuccessMetadata } from 'plaid'
import {
    fetchActiveItemByUserIdAndInstitutionId,
    fetchActiveItems,
    insertItem,
} from '../database/itemQueries.js'
import { HttpError } from '../models/httpError.js'
import { Item } from '../models/item.js'
import { PlaidLinkEvent } from '../models/plaidLinkEvent.js'
import {
    plaidLinkTokenCreate,
    plaidPublicTokenExchange,
} from '../plaid/tokenMethods.js'
import { queueItemSync } from '../queues/itemQueue.js'
import { queuePlaidLinkEventLog } from '../queues/logQueue.js'
import { logger } from '../utils/logger.js'

export const createLinkToken = async (req: Request, res: Response) => {
    logger.debug('creating link token')

    const userId: number | undefined = req.session.user?.id
    if (userId === undefined) throw new HttpError('missing user id', 400)

    const itemId: number | undefined = req.body.itemId
    const updateAccounts: boolean | undefined = req.body.updateAccounts

    if (updateAccounts === true && itemId === undefined) {
        throw new HttpError('missing item id', 400)
    }

    const items = await fetchActiveItems()
    const item = items.filter((i) => i.id === itemId)[0]
    if (!item) throw new HttpError('invalid item', 400)

    try {
        let token = ''
        if (updateAccounts === true) {
            token = await plaidLinkTokenCreate(userId, item.itemId, true)
        } else if (itemId !== undefined) {
            token = await plaidLinkTokenCreate(userId, item.itemId)
        } else {
            token = await plaidLinkTokenCreate(userId)
        }
        return res.send({ linkToken: token })
    } catch (error) {
        logger.error(error)
        if (error instanceof HttpError) throw error
        throw Error('failed to create link token')
    }
}

export const handleLinkEvent = async (req: Request, res: Response) => {
    logger.debug('handling link event')

    const event: PlaidLinkEvent | undefined = req.body.event
    if (!event) throw new HttpError('missing event', 400)

    await queuePlaidLinkEventLog(event)
    return res.status(202).send()
}

export const exchangePublicToken = async (req: Request, res: Response) => {
    logger.debug('exchanging public token')

    const userId: number | undefined = req.session.user?.id
    const publicToken: string | undefined = req.body.publicToken
    const metadata: LinkSessionSuccessMetadata | undefined = req.body.metadata
    const institution = metadata?.institution

    if (userId === undefined) throw new HttpError('missing user id', 400)
    if (publicToken === undefined)
        throw new HttpError('missing public token', 400)
    if (!metadata) throw new HttpError('missing metadata', 400)
    if (
        !institution ||
        institution.institution_id === undefined ||
        institution.name === undefined
    )
        throw new HttpError('missing institution info', 400)

    try {
        const existingItem = await fetchActiveItemByUserIdAndInstitutionId(
            userId,
            institution.institution_id
        )
        if (existingItem) throw new HttpError('account already exists', 409)

        const { accessToken, itemId } = await plaidPublicTokenExchange(
            publicToken,
            userId
        )

        const item: Item = {
            id: -1,
            userId,
            itemId,
            active: true,
            accessToken,
            institutionId: institution.institution_id,
            institutionName: institution.name,
            healthy: true,
            cursor: null,
            lastSynced: null,
            lastRefreshed: null,
        }
        const newItem = await insertItem(item)
        if (!newItem) throw Error('item not created')

        await queueItemSync(newItem)

        return res.status(204).send()
    } catch (error) {
        logger.error(error)
        if (error instanceof HttpError) throw error
        throw Error('failed to exchange public token')
    }
}
