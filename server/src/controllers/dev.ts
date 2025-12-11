import {
    refreshItemInvestments,
    refreshItemTransactions,
    removeDeactivateItem,
    syncItemData,
} from '@controllers'
import {
    fetchActiveItemByPlaidId,
    fetchActiveItemByUserIdAndInstitutionId,
    fetchActiveItemsByUserId,
    fetchUserByUsername,
    fetchUsers,
    insertItem,
    removeUserById,
} from '@database'
import { HttpError } from '@models'
import {
    plaidPublicTokenExchange,
    plaidSandboxFireWebhook,
    plaidSandboxPublicTokenCreate,
    plaidSandboxResetLogin,
} from '@plaid'
import {
    queueSyncItemBalances,
    queueSyncItemInvestments,
    queueSyncItemLiabilities,
    queueSyncItemTransactions,
} from '@queues'
import { logger, validate } from '@utilities'
import {
    DevFireSandboxWebhookQuerySchema,
    DevForceRefreshItemInvestmentsQuerySchema,
    DevForceRefreshItemTransactionsQuerySchema,
    DevResetSandboxItemLoginQuerySchema,
    DevSyncItemBalancesQuerySchema,
    DevSyncItemInvestmentsQuerySchema,
    DevSyncItemLiabilitiesQuerySchema,
    DevSyncItemQuerySchema,
    DevSyncItemTransactionsQuerySchema,
    Item,
} from '@wealthwatch-shared'
import { Request, Response } from 'express'
import { SandboxItemFireWebhookRequestWebhookCodeEnum as WebhookCodeEnum } from 'plaid'

export const devDeleteAllUsers = async (req: Request, res: Response) => {
    logger.debug('deleting all users')
    await deactivateItems(true)
    req.session.destroy(() => res.status(204).send())
}

export const devDeactivateAllItems = async (_req: Request, res: Response) => {
    logger.debug('deactivating all items')
    await deactivateItems()
    res.status(204).send()
}

export const devCreateSandboxItem = async (req: Request, res: Response) => {
    logger.debug('creating sandbox item')

    const sessionUser = req.session.user
    if (!sessionUser) throw new HttpError('missing user', 400)

    const user = await fetchUserByUsername(sessionUser.username)
    if (!user) throw new HttpError('user not found', 404)

    const institutionId = 'ins_56'
    const institutionName = 'Chase'
    const existingItem = await fetchActiveItemByUserIdAndInstitutionId(
        user.id,
        institutionId
    )
    if (existingItem) throw new HttpError('item already linked', 409)

    const publicToken = await plaidSandboxPublicTokenCreate(user, institutionId)
    const { accessToken, plaidItemId } = await plaidPublicTokenExchange(
        publicToken,
        user.id
    )

    const item: Item = {
        id: -1,
        userId: user.id,
        plaidId: plaidItemId,
        active: true,
        accessToken,
        institutionId,
        institutionName,
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

export const devForceRefreshItemTransactions = async (
    req: Request,
    res: Response
) => {
    logger.debug('force refreshing item transactions')

    const query = validate(
        req.query,
        DevForceRefreshItemTransactionsQuerySchema
    )

    const item = await fetchActiveItemByPlaidId(query.plaidItemId)
    if (!item) throw new HttpError('item not found', 404)
    await refreshItemTransactions(item, false)

    res.status(204).send()
}

export const devForceRefreshItemInvestments = async (
    req: Request,
    res: Response
) => {
    logger.debug('force refreshing item investments')

    const query = validate(req.query, DevForceRefreshItemInvestmentsQuerySchema)

    const item = await fetchActiveItemByPlaidId(query.plaidItemId)
    if (!item) throw new HttpError('item not found', 404)
    await refreshItemInvestments(item, false)

    res.status(204).send()
}

export const devSyncItem = async (req: Request, res: Response) => {
    logger.debug('syncing item')

    const query = validate(req.query, DevSyncItemQuerySchema)

    const item = await fetchActiveItemByPlaidId(query.plaidItemId)
    if (!item) throw new HttpError('item not found', 404)
    await syncItemData(item)

    res.status(202).send()
}

export const devSyncItemTransactions = async (req: Request, res: Response) => {
    logger.debug('syncing item transactions')

    const query = validate(req.query, DevSyncItemTransactionsQuerySchema)

    const item = await fetchActiveItemByPlaidId(query.plaidItemId)
    if (!item) throw new HttpError('item not found', 404)
    await queueSyncItemTransactions(item, true)

    res.status(202).send()
}

export const devSyncItemInvestments = async (req: Request, res: Response) => {
    logger.debug('syncing item investments')

    const query = validate(req.query, DevSyncItemInvestmentsQuerySchema)

    const item = await fetchActiveItemByPlaidId(query.plaidItemId)
    if (!item) throw new HttpError('item not found', 404)
    await queueSyncItemInvestments(item, true)

    res.status(202).send()
}

export const devSyncItemLiabilities = async (req: Request, res: Response) => {
    logger.debug('syncing item liabilities')

    const query = validate(req.query, DevSyncItemLiabilitiesQuerySchema)

    const item = await fetchActiveItemByPlaidId(query.plaidItemId)
    if (!item) throw new HttpError('item not found', 404)
    await queueSyncItemLiabilities(item, true)

    res.status(202).send()
}

export const devSyncItemBalances = async (req: Request, res: Response) => {
    logger.debug('syncing item balances')

    const query = validate(req.query, DevSyncItemBalancesQuerySchema)

    const item = await fetchActiveItemByPlaidId(query.plaidItemId)
    if (!item) throw new HttpError('item not found', 404)
    await queueSyncItemBalances(item)

    res.status(202).send()
}

export const devResetSandboxItemLogin = async (req: Request, res: Response) => {
    logger.debug('resetting sandbox item login')

    const query = validate(req.query, DevResetSandboxItemLoginQuerySchema)

    const item = await fetchActiveItemByPlaidId(query.plaidItemId)
    if (!item) throw new HttpError('item not found', 404)

    const reset = await plaidSandboxResetLogin(item)
    if (!reset) throw new HttpError('failed to reset item login')

    res.status(204).send()
}

export const devFireSandboxWebhook = async (req: Request, res: Response) => {
    logger.debug('firing sandbox webhook')

    const query = validate(req.query, DevFireSandboxWebhookQuerySchema)

    const webhookCode = query.webhookCode as WebhookCodeEnum

    const item = await fetchActiveItemByPlaidId(query.plaidItemId)
    if (!item) throw new HttpError('item not found', 404)

    const fired = await plaidSandboxFireWebhook(item, webhookCode)
    if (!fired) throw new HttpError('failed to fire webhook')

    res.status(204).send()
}

const deactivateItems = async (deleteUsers = false) => {
    const users = await fetchUsers()
    await Promise.all(
        users.map(async (user) => {
            logger.debug({ id: user.id }, 'deactivating user items')

            const items = await fetchActiveItemsByUserId(user.id)
            await Promise.all(
                items.map(async (item) => {
                    await removeDeactivateItem(item)
                })
            )

            if (deleteUsers) {
                logger.debug({ id: user.id }, 'deleting user')
                await removeUserById(user.id)
            }
        })
    )
}
