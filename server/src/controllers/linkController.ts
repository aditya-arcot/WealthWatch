import { Request, Response } from 'express'
import { LinkSessionSuccessMetadata } from 'plaid'
import {
    fetchActiveItemsWithUserId,
    fetchActiveItemWithUserIdAndInstitutionId,
    insertItem,
} from '../database/itemQueries.js'
import { HttpError } from '../models/error.js'
import { Item } from '../models/item.js'
import { PlaidLinkEvent } from '../models/plaidLinkEvent.js'
import {
    plaidLinkTokenCreate,
    plaidPublicTokenExchange,
} from '../plaid/tokenMethods.js'
import {
    queueSyncItemBalances,
    queueSyncItemInvestments,
    queueSyncItemTransactions,
} from '../queues/itemQueue.js'
import { queueLogPlaidLinkEvent } from '../queues/logQueue.js'
import { logger } from '../utils/logger.js'

export const createLinkToken = async (req: Request, res: Response) => {
    logger.debug('creating link token')

    const userId = req.session.user?.id
    if (userId === undefined) throw new HttpError('missing user id', 400)

    const itemId = req.body.itemId
    const updateAccounts = req.body.updateAccounts

    if (itemId === undefined) {
        const linkToken = await plaidLinkTokenCreate(userId)
        return res.json({ linkToken })
    }

    if (typeof itemId !== 'number') throw new HttpError('invalid item id', 400)
    if (updateAccounts !== undefined && typeof updateAccounts !== 'boolean')
        throw new HttpError('invalid update accounts flag', 400)

    const items = await fetchActiveItemsWithUserId(userId)
    const item = items.filter((i) => i.id === itemId)[0]
    if (!item) throw new HttpError('item not found', 404)

    const linkToken = await plaidLinkTokenCreate(userId, item, updateAccounts)
    return res.json({ linkToken })
}

export const handleLinkEvent = async (req: Request, res: Response) => {
    logger.debug('handling link event')

    const event = req.body.event as PlaidLinkEvent
    if (typeof event !== 'object')
        throw new HttpError('missing or invalid event', 400)

    await queueLogPlaidLinkEvent(event)

    return res.status(202).send()
}

export const exchangePublicToken = async (req: Request, res: Response) => {
    logger.debug('exchanging public token')

    const userId = req.session.user?.id
    if (userId === undefined) throw new HttpError('missing user id', 400)

    const publicToken = req.body.publicToken
    if (typeof publicToken !== 'string')
        throw new HttpError('missing or invalid public token', 400)

    const metadata = req.body.metadata as LinkSessionSuccessMetadata
    if (typeof metadata !== 'object')
        throw new HttpError('missing or invalid metadata', 400)

    const institution = metadata?.institution
    if (
        !institution ||
        institution.institution_id === undefined ||
        institution.name === undefined
    )
        throw new HttpError('missing institution info', 400)

    const existingItem = await fetchActiveItemWithUserIdAndInstitutionId(
        userId,
        institution.institution_id
    )
    if (existingItem) throw new HttpError('item already linked', 409)

    const { accessToken, plaidItemId } = await plaidPublicTokenExchange(
        publicToken,
        userId
    )

    const item: Item = {
        id: -1,
        userId,
        plaidId: plaidItemId,
        active: true,
        accessToken,
        institutionId: institution.institution_id,
        institutionName: institution.name,
        healthy: true,
        cursor: null,
        lastRefreshed: null,
        transactionsLastRefreshed: null,
        investmentsLastRefreshed: null,
    }
    const newItem = await insertItem(item)
    if (!newItem) throw new HttpError('failed to insert item')

    logger.debug('queueing item syncs')
    await queueSyncItemTransactions(newItem)
    await queueSyncItemInvestments(newItem)
    await queueSyncItemBalances(newItem)

    return res.status(204).send()
}
