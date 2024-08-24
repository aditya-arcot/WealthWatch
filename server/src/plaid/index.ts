import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid'
import { HttpError } from '../models/httpError.js'
import { PlaidApiRequest } from '../models/plaidApiRequest.js'
import { queueLogPlaidApiRequest } from '../queues/logQueue.js'
import { vars } from '../utils/env.js'
import { safeStringify } from '../utils/format.js'
import { logger } from '../utils/logger.js'

let plaidClient: PlaidApi | undefined

export const createPlaidClient = () => {
    logger.debug('configuring plaid client')
    const config = new Configuration({
        basePath: PlaidEnvironments[vars.plaidEnv]!,
        baseOptions: {
            headers: {
                'PLAID-CLIENT-ID': vars.plaidClientId,
                'PLAID-SECRET': vars.plaidSecret,
            },
        },
    })
    plaidClient = new PlaidApi(config)
    logger.debug('configured plaid client')
}

export const getPlaidClient = (): PlaidApi => {
    if (!plaidClient) throw new HttpError('plaid client not initialized')
    return plaidClient
}

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

        await queueLogPlaidApiRequest(req)
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

        await queueLogPlaidApiRequest(req)
        throw error
    }
}
