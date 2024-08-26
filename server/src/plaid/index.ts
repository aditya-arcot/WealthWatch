import { isAxiosError } from 'axios'
import { Configuration, PlaidApi, PlaidEnvironments, PlaidError } from 'plaid'
import { HttpError, PlaidApiError } from '../models/error.js'
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
        logger.error(`${method.name} error`)

        req.duration = Date.now() - req.timestamp.getTime()
        if (error instanceof Error) {
            req.errorType = error.name
            req.errorMessage = error.message
            req.errorStack = error.stack ?? null
            if (isAxiosError(error)) {
                // all errors should be Plaid errors
                const plaidErr = error.response?.data as PlaidError
                req.errorCode = plaidErr.error_code
                req.errorType = plaidErr.error_type
                req.errorMessage = plaidErr.error_message
                req.errorResponse = plaidErr
                await queueLogPlaidApiRequest(req)
                throw new PlaidApiError(
                    plaidErr.error_code,
                    plaidErr.error_type,
                    plaidErr.error_message
                )
            }
        } else {
            req.errorType = 'non-error object'
        }

        await queueLogPlaidApiRequest(req)
        throw error
    }
}
