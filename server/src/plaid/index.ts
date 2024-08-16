import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid'
import { env } from 'process'
import { PlaidApiRequest } from '../models/plaidApiRequest.js'
import { queuePlaidApiRequestLog } from '../queues/logQueue.js'
import { safeStringify } from '../utils/format.js'
import { logger } from '../utils/logger.js'

if (
    env['PLAID_ENV'] === undefined ||
    env['PLAID_CLIENT_ID'] === undefined ||
    env['PLAID_SECRET'] === undefined
) {
    throw Error('missing one or more plaid secrets')
}
const config = new Configuration({
    basePath: PlaidEnvironments[env['PLAID_ENV']]!,
    baseOptions: {
        headers: {
            'PLAID-CLIENT-ID': env['PLAID_CLIENT_ID'],
            'PLAID-SECRET': env['PLAID_SECRET'],
        },
    },
})
export const plaidClient = new PlaidApi(config)
logger.debug({ config }, 'configured plaid client')

export const executePlaidMethod = async <T extends object, P extends object>(
    method: (params: P) => Promise<T>,
    params: P,
    userId?: number,
    itemId?: number
) => {
    const req: PlaidApiRequest = {
        id: -1,
        timestamp: new Date(),
        duration: -1,
        userId: userId ?? null,
        itemId: itemId ?? null,
        method: method.name,
        params,
    }

    try {
        const resp: T = await method.bind(plaidClient)(params)
        req.duration = Date.now() - req.timestamp.getTime()

        const sanitized = JSON.parse(safeStringify(resp)) as {
            request?: object
        }
        delete sanitized['request']
        req.response = sanitized

        await queuePlaidApiRequestLog(req)
        return resp
    } catch (error) {
        req.duration = Date.now() - req.timestamp.getTime()

        logger.error({ error }, `plaid client error - ${method.name}`)
        if (error instanceof Error) {
            req.errorName = error.name
            req.errorMessage = error.message
            req.errorStack = error.stack ?? null
        } else {
            req.errorName = 'unknown'
        }

        await queuePlaidApiRequestLog(req)
        throw error
    }
}
