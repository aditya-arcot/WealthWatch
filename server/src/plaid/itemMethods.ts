import { ItemRemoveRequest, SandboxItemResetLoginRequest } from 'plaid'
import { logger } from '../utilities/logger.js'
import { Item } from '../wealthwatch-shared.js'
import { executePlaidMethod, getPlaidClient } from './index.js'

export const plaidItemRemove = async (item: Item) => {
    logger.debug({ id: item.id }, 'removing item')
    // eslint-disable-next-line @typescript-eslint/naming-convention
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
        // eslint-disable-next-line @typescript-eslint/naming-convention
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
