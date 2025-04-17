import { ItemRemoveRequest, SandboxItemResetLoginRequest } from 'plaid'
import { Item } from 'wealthwatch-shared'
import { logger } from '../utilities/logger.js'
import { executePlaidMethod, getPlaidClient } from './index.js'

export const plaidItemRemove = async (item: Item) => {
    logger.debug({ id: item.id }, 'removing item')
    const params: ItemRemoveRequest = { access_token: item.accessToken }
    await executePlaidMethod(
        getPlaidClient().itemRemove,
        params,
        item.userId,
        item.id
    )
}

export const plaidSandboxResetLogin = async (item: Item) => {
    logger.debug({ id: item.id }, 'resetting item login')
    const params: SandboxItemResetLoginRequest = {
        access_token: item.accessToken,
    }
    const resp = await executePlaidMethod(
        getPlaidClient().sandboxItemResetLogin,
        params,
        item.userId,
        item.id
    )
    return resp.data.reset_login
}
