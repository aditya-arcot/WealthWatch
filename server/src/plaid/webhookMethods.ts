import { importJWK, JWK, jwtVerify } from 'jose'
import { sha256 } from 'js-sha256'
import { jwtDecode } from 'jwt-decode'
import {
    SandboxItemFireWebhookRequest,
    SandboxItemFireWebhookRequestWebhookCodeEnum as WebhookCodeEnum,
} from 'plaid'
import { Item } from '../models/item.js'
import { logger } from '../utils/logger.js'
import { executePlaidMethod, plaidClient } from './index.js'

export const plaidFireWebhook = async (item: Item, code: WebhookCodeEnum) => {
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

export const plaidVerifyWebhook = async (
    token: string,
    body: string
): Promise<void> => {
    logger.debug({ token, body }, 'verifying webhook')

    const decodedTokenHeader = jwtDecode(token, { header: true })
    if (
        !decodedTokenHeader.kid ||
        !decodedTokenHeader.alg ||
        !decodedTokenHeader.typ
    ) {
        throw Error('invalid jwt header')
    }
    if (decodedTokenHeader.alg !== 'ES256') {
        throw Error('invalid algorithm')
    }
    if (decodedTokenHeader.typ !== 'JWT') {
        throw Error('invalid type')
    }

    const params = { key_id: decodedTokenHeader.kid }
    const resp = await executePlaidMethod(
        plaidClient.webhookVerificationKeyGet,
        params
    )
    const plaidJwk = resp.data.key

    const joseJwk: JWK = {
        alg: plaidJwk.alg,
        crv: plaidJwk.crv,
        kid: plaidJwk.kid,
        kty: plaidJwk.kty,
        use: plaidJwk.use,
        x: plaidJwk.x,
        y: plaidJwk.y,
    }
    const keyLike = await importJWK(joseJwk)

    const { payload } = await jwtVerify(token, keyLike, {
        maxTokenAge: '5 min',
    })
    if (sha256(body) !== payload['request_body_sha256']) {
        throw Error('body hash does not match')
    }
}
