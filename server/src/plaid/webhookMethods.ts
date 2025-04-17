import {
    SandboxItemFireWebhookRequest,
    SandboxItemFireWebhookRequestWebhookCodeEnum as WebhookCodeEnum,
} from 'plaid'
import { Item } from 'wealthwatch-shared'
import { logger } from '../utilities/logger.js'
import { executePlaidMethod, getPlaidClient } from './index.js'

export const plaidSandboxFireWebhook = async (
    item: Item,
    code: WebhookCodeEnum
) => {
    logger.debug({ itemId: item.id, code }, 'firing webhook')
    const params: SandboxItemFireWebhookRequest = {
        access_token: item.accessToken,
        webhook_code: code,
    }
    const resp = await executePlaidMethod(
        getPlaidClient().sandboxItemFireWebhook,
        params,
        item.userId,
        item.id
    )
    return resp.data.webhook_fired
}

export const plaidWebhookVerificationKeyGet = async (kid: string) => {
    logger.debug({ kid }, 'getting webhook verification key')
    const params = { key_id: kid }
    const resp = await executePlaidMethod(
        getPlaidClient().webhookVerificationKeyGet,
        params
    )
    return resp.data.key
}
