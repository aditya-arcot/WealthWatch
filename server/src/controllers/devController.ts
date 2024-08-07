import { Request, Response } from 'express'
import { SandboxItemFireWebhookRequestWebhookCodeEnum as WebhookCodeEnum } from 'plaid'
import {
    fetchActiveItemById,
    fetchActiveItemByUserIdAndInstitutionId,
    fetchActiveItemsByUserId,
    insertItem,
    modifyItemActiveById,
} from '../database/itemQueries.js'
import { fetchUsers, removeUserById } from '../database/userQueries.js'
import { HttpError } from '../models/httpError.js'
import { Item } from '../models/item.js'
import { User } from '../models/user.js'
import { plaidResetItemLogin, plaidUnlinkItem } from '../plaid/itemMethods.js'
import {
    plaidCreatePublicToken,
    plaidExchangePublicToken,
} from '../plaid/tokenMethods.js'
import { plaidFireWebhook } from '../plaid/webhookMethods.js'
import { queueItemSync } from '../queues/itemSyncQueue.js'
import { logger } from '../utils/logger.js'

export const deleteAllUsers = async (req: Request, res: Response) => {
    logger.debug('deleting all users')
    await deactivateItems(true)
    req.session.destroy(() => res.status(204).send())
}

export const deactivateAllItems = async (_req: Request, res: Response) => {
    logger.debug('deactivating all items')
    await deactivateItems(false)
    return res.status(204).send()
}

const deactivateItems = async (deleteUsers: boolean) => {
    const users = await fetchUsers()
    await Promise.all(
        users.map(async (user) => {
            logger.debug({ user }, 'processing items for user')

            const items = await fetchActiveItemsByUserId(user.id)
            await Promise.all(
                items.map(async (item) => {
                    logger.debug({ item }, 'unlinking & deactivating item')
                    await plaidUnlinkItem(item)
                    await modifyItemActiveById(item.id, false)
                })
            )

            if (deleteUsers) {
                logger.debug({ user }, 'deleting user')
                await removeUserById(user.id)
            }
        })
    )
}

export const syncItem = async (req: Request, res: Response) => {
    logger.debug('syncing item')

    const itemId: string | undefined = req.query['itemId'] as string
    if (!itemId) throw new HttpError('missing item id', 400)

    const item = await fetchActiveItemById(itemId)
    if (!item) throw new HttpError('item not found', 404)

    await queueItemSync(item)
    return res.status(202).send()
}

export const createSandboxItem = async (req: Request, res: Response) => {
    logger.debug('creating sandbox item')

    const user: User | undefined = req.session.user
    if (!user) throw new HttpError('missing user', 400)

    const institutionId = 'ins_56'
    const institutionName = 'Chase'
    const existingItem = await fetchActiveItemByUserIdAndInstitutionId(
        user.id,
        institutionId
    )
    if (existingItem) throw new HttpError('account already exists', 409)

    const publicToken = await plaidCreatePublicToken(user, institutionId)
    const { accessToken, itemId } = await plaidExchangePublicToken(
        publicToken,
        user.id
    )

    const item: Item = {
        id: -1,
        userId: user.id,
        itemId,
        active: true,
        accessToken,
        institutionId,
        institutionName,
        healthy: true,
        cursor: null,
    }
    const newItem = await insertItem(item)
    if (!newItem) throw Error('item not created')

    await queueItemSync(newItem)

    return res.status(204).send()
}

export const resetSandboxItemLogin = async (req: Request, res: Response) => {
    logger.debug('resetting sandbox item login')

    const itemId: string | undefined = req.query['itemId'] as string
    if (!itemId) throw new HttpError('missing item id', 400)

    const item = await fetchActiveItemById(itemId)
    if (!item) throw new HttpError('item not found', 404)

    const reset = await plaidResetItemLogin(item)
    if (!reset) throw Error('failed to reset item login')
    return res.status(204).send()
}

export const fireSandboxWebhook = async (req: Request, res: Response) => {
    logger.debug('firing sandbox webhook')

    const itemId: string | undefined = req.query['itemId'] as string
    if (!itemId) throw new HttpError('missing item id', 400)

    const code: string | undefined = req.query['code'] as string
    if (!code) throw new HttpError('missing webhook code', 400)

    const item = await fetchActiveItemById(itemId)
    if (!item) throw new HttpError('item not found', 404)

    const codeEnum = code as WebhookCodeEnum
    if (!codeEnum || !Object.values(WebhookCodeEnum).includes(codeEnum)) {
        throw new HttpError('invalid webhook code', 400)
    }

    const fired = await plaidFireWebhook(item, codeEnum)
    if (!fired) throw new Error('failed to fire webhook')
    return res.status(204).send()
}
