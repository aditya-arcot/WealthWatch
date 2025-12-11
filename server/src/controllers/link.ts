import { syncItemData } from '@controllers'
import {
    fetchActiveItemByUserIdAndId,
    fetchActiveItemByUserIdAndInstitutionId,
    insertItem,
    modifyItemHealthyById,
    modifyNotificationsToInactiveByTypeIdUserIdAndItemId,
} from '@database'
import { HttpError } from '@models'
import { plaidLinkTokenCreate, plaidPublicTokenExchange } from '@plaid'
import { queueLogPlaidLinkEvent } from '@queues'
import { logger, validate } from '@utilities'
import {
    CreateLinkTokenBodySchema,
    ExchangePublicTokenBodySchema,
    HandleLinkEventBodySchema,
    HandleLinkUpdateCompleteBodySchema,
    Item,
    NotificationTypeEnum,
} from '@wealthwatch-shared'
import { Request, Response } from 'express'

export const createLinkToken = async (req: Request, res: Response) => {
    logger.debug('creating link token')

    const userId = req.session.user?.id
    if (userId === undefined) throw new HttpError('missing user id', 400)

    const body = validate(req.body, CreateLinkTokenBodySchema)

    if (body.itemId === undefined) {
        const linkToken = await plaidLinkTokenCreate(userId)
        return res.json({ linkToken })
    }

    if (typeof body.itemId !== 'number')
        throw new HttpError('invalid item id', 400)
    if (
        body.updateAccounts !== undefined &&
        typeof body.updateAccounts !== 'boolean'
    )
        throw new HttpError('invalid update accounts flag', 400)

    const item = await fetchActiveItemByUserIdAndId(userId, body.itemId)
    if (!item) throw new HttpError('item not found', 404)

    const linkToken = await plaidLinkTokenCreate(
        userId,
        item,
        body.updateAccounts
    )
    return res.json({ linkToken })
}

export const handleLinkEvent = async (req: Request, res: Response) => {
    logger.debug('handling link event')
    const body = validate(req.body, HandleLinkEventBodySchema)
    await queueLogPlaidLinkEvent(body.event)
    res.status(202).send()
}

export const exchangePublicToken = async (req: Request, res: Response) => {
    logger.debug('exchanging public token')

    const userId = req.session.user?.id
    if (userId === undefined) throw new HttpError('missing user id', 400)

    const body = validate(req.body, ExchangePublicTokenBodySchema)

    const institution = body.metadata.institution
    if (
        institution?.institution_id === undefined ||
        institution.name === undefined
    )
        throw new HttpError('missing institution info', 400)

    const existingItem = await fetchActiveItemByUserIdAndInstitutionId(
        userId,
        institution.institution_id
    )
    if (existingItem) throw new HttpError('item already linked', 409)

    const { accessToken, plaidItemId } = await plaidPublicTokenExchange(
        body.publicToken,
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
    await syncItemData(newItem)

    res.status(202).send()
}

export const handleLinkUpdateComplete = async (req: Request, res: Response) => {
    logger.debug('handling link update complete')

    const userId = req.session.user?.id
    if (userId === undefined) throw new HttpError('missing user id', 400)

    const body = validate(req.body, HandleLinkUpdateCompleteBodySchema)

    const notificationTypeId = body.notificationTypeId as NotificationTypeEnum

    const item = await fetchActiveItemByUserIdAndId(userId, body.itemId)
    if (!item) throw new HttpError('item not found', 404)

    logger.debug('updating item to healthy')
    await modifyItemHealthyById(body.itemId, true)

    logger.debug('updating notifications to inactive')
    await modifyNotificationsToInactiveByTypeIdUserIdAndItemId(
        notificationTypeId,
        userId,
        body.itemId
    )

    await syncItemData(item)

    res.status(202).send()
}
