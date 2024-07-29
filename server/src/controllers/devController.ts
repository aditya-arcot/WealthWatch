import { Request, Response } from 'express'
import { SandboxItemFireWebhookRequestWebhookCodeEnum } from 'plaid'
import { HttpError } from '../models/httpError.js'
import {
    retrieveItemById,
    retrieveItemByUserIdAndInstitutionId,
    retrieveItemsByUserId,
    updateItemToInactive,
} from '../models/item.js'
import { deleteUser, retrieveUsers, User } from '../models/user.js'
import {
    createPublicToken,
    exchangePublicTokenAndCreateItemAndSync,
    fireWebhook,
    removeItem,
    syncItemData,
} from '../services/plaidService.js'
import { logger } from '../utils/logger.js'

export const deleteUsers = async (req: Request, res: Response) => {
    logger.debug('deleting all users')

    const users = await retrieveUsers()
    await Promise.all(
        users.map(async (user) => {
            logger.debug({ user }, 'deleting user')
            const items = await retrieveItemsByUserId(user.id)
            await Promise.all(items.map((item) => removeItem(item)))
            await deleteUser(user.id)
        })
    )

    req.session.destroy(() => res.status(204).send())
}

export const deactivateItems = async (_req: Request, res: Response) => {
    logger.debug('deactivating all items')

    const users = await retrieveUsers()
    await Promise.all(
        users.map(async (user) => {
            logger.debug({ user }, 'deactivating items for user')

            const items = await retrieveItemsByUserId(user.id)
            await Promise.all(
                items.map(async (item) => {
                    await removeItem(item)
                    await updateItemToInactive(item.id)
                })
            )
        })
    )

    return res.status(204).send()
}

export const fireSandboxWebhook = async (req: Request, res: Response) => {
    const itemId: string | undefined = req.query['itemId'] as string
    if (!itemId) throw new HttpError('missing item id', 400)

    const item = await retrieveItemById(itemId)
    if (!item) throw new HttpError('item not found', 404)

    const code: string | undefined = req.query['code'] as string
    const codeEnum = code as SandboxItemFireWebhookRequestWebhookCodeEnum
    if (
        !codeEnum ||
        !Object.values(SandboxItemFireWebhookRequestWebhookCodeEnum).includes(
            codeEnum
        )
    ) {
        throw new HttpError('invalid webhook code', 400)
    }

    await fireWebhook(item, codeEnum)
    return res.status(204).send()
}

export const createSandboxItem = async (req: Request, res: Response) => {
    const user: User | undefined = req.session.user
    if (!user) throw new HttpError('missing user', 400)

    const institutionId = 'ins_56'
    const institutionName = 'Chase'
    const item = await retrieveItemByUserIdAndInstitutionId(
        user.id,
        institutionId
    )
    if (item) throw new HttpError('account already exists', 409)

    const publicToken = await createPublicToken(user, institutionId)
    await exchangePublicTokenAndCreateItemAndSync(
        user.id,
        institutionId,
        institutionName,
        publicToken
    )
    return res.status(204).send()
}

export const syncItem = async (req: Request, res: Response) => {
    const itemId: string | undefined = req.query['itemId'] as string
    if (!itemId) throw new HttpError('missing item id', 400)

    const item = await retrieveItemById(itemId)
    if (!item) throw new HttpError('item not found', 404)

    await syncItemData(item)
    return res.status(204).send()
}
