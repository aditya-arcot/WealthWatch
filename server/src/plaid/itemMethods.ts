import {
    ItemRemoveRequest,
    ItemWebhookUpdateRequest,
    SandboxItemResetLoginRequest,
} from 'plaid'
import { Item } from '../models/item.js'
import { logger } from '../utils/logger.js'
import { executePlaidMethod, plaidClient } from './index.js'

export const plaidItemRemove = async (item: Item) => {
    logger.debug({ item }, 'removing item')
    const params: ItemRemoveRequest = { access_token: item.accessToken }
    await executePlaidMethod(
        plaidClient.itemRemove,
        params,
        item.userId,
        item.id
    )
}

export const plaidSandboxResetLogin = async (item: Item) => {
    logger.debug({ item }, 'resetting item login')
    const params: SandboxItemResetLoginRequest = {
        access_token: item.accessToken,
    }
    const resp = await executePlaidMethod(
        plaidClient.sandboxItemResetLogin,
        params,
        item.userId,
        item.id
    )
    return resp.data.reset_login
}

export const plaidWebhookUpdate = async (item: Item, webhook: string) => {
    logger.debug({ item }, 'updating item webhook')
    const params: ItemWebhookUpdateRequest = {
        access_token: item.accessToken,
        webhook,
    }
    await executePlaidMethod(
        plaidClient.itemWebhookUpdate,
        params,
        item.userId,
        item.id
    )
}
