import {
    SandboxItemFireWebhookRequest,
    SandboxItemFireWebhookRequestWebhookCodeEnum as WebhookCodeEnum,
} from 'plaid'
import { Item } from '../models/item.js'
import { logger } from '../utils/logger.js'
import { executePlaidMethod, plaidClient } from './index.js'

export const plaidSandboxFireWebhook = async (
    item: Item,
    code: WebhookCodeEnum
) => {
    logger.debug({ item, code }, 'firing webhook')
    const params: SandboxItemFireWebhookRequest = {
        access_token: item.accessToken,
        webhook_code: code,
    }
    const resp = await executePlaidMethod(
        plaidClient.sandboxItemFireWebhook,
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
        plaidClient.webhookVerificationKeyGet,
        params
    )
    return resp.data.key
}
