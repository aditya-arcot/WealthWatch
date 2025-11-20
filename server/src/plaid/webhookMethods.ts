import { executePlaidMethod, getPlaidClient } from '@plaid/index.js'
import { logger } from '@utilities/logger.js'
import { Item } from '@wealthwatch-shared'
import {
    SandboxItemFireWebhookRequest,
    SandboxItemFireWebhookRequestWebhookCodeEnum as WebhookCodeEnum,
} from 'plaid'

export const plaidSandboxFireWebhook = async (
    item: Item,
    code: WebhookCodeEnum
) => {
    logger.debug({ itemId: item.id, code }, 'firing webhook')
    const params: SandboxItemFireWebhookRequest = {
        /* eslint-disable @typescript-eslint/naming-convention */
        access_token: item.accessToken,
        webhook_code: code,
        /* eslint-enable @typescript-eslint/naming-convention */
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
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const params = { key_id: kid }
    const resp = await executePlaidMethod(
        getPlaidClient().webhookVerificationKeyGet,
        params
    )
    return resp.data.key
}
