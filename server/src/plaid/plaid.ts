import {
    insertInfoNotification,
    insertLinkUpdateNotification,
    insertLinkUpdateWithAccountsNotification,
} from '@controllers'
import { fetchActiveItemByUserIdAndId } from '@database'
import { PlaidGeneralErrorCodeEnum } from '@enums'
import { HttpError, PlaidApiError, PlaidApiRequest } from '@models'
import { queueLogPlaidApiRequest } from '@queues'
import { logger, safeStringify, vars } from '@utilities'
import { AxiosError, isAxiosError } from 'axios'
import { Configuration, PlaidApi, PlaidEnvironments, PlaidError } from 'plaid'

let plaidClient: PlaidApi | undefined

export const createPlaidClient = () => {
    logger.debug('creating plaid client')
    const basePath = PlaidEnvironments[vars.plaidEnv]
    if (basePath === undefined) throw Error('invalid plaid env')
    const config = new Configuration({
        basePath,
        baseOptions: {
            headers: {
                /* eslint-disable @typescript-eslint/naming-convention */
                'PLAID-CLIENT-ID': vars.plaidClientId,
                'PLAID-SECRET': vars.plaidSecret,
                /* eslint-enable @typescript-eslint/naming-convention */
            },
        },
    })
    plaidClient = new PlaidApi(config)
    logger.debug('created plaid client')
}

export const getPlaidClient = (): PlaidApi => {
    if (!plaidClient) throw Error('plaid client not initialized')
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
        delete sanitized.request
        req.response = sanitized

        await queueLogPlaidApiRequest(req)
        return resp
    } catch (error) {
        req.duration = Date.now() - req.timestamp.getTime()

        if (isAxiosError(error)) {
            // all errors should be Axios/Plaid errors
            return handlePlaidError(error, req, method.name, userId, itemId)
        } else if (error instanceof Error) {
            logger.error(`${method.name} error - ${error.name}`)
            req.errorType = error.name
            req.errorMessage = error.message
            req.errorStack = error.stack ?? null
            await queueLogPlaidApiRequest(req)
            throw error
        } else {
            logger.error(`${method.name} error - unknown`)
            req.errorType = 'non-error object'
            await queueLogPlaidApiRequest(req)
            throw error
        }
    }
}

const handlePlaidError = async (
    error: AxiosError,
    req: PlaidApiRequest,
    methodName: string,
    userId?: number,
    itemId?: number
) => {
    const plaidErr = error.response?.data as PlaidError
    logger.error(`${methodName} error - ${plaidErr.error_code}`)

    req.errorCode = plaidErr.error_code
    req.errorType = plaidErr.error_type
    req.errorMessage = plaidErr.error_message
    req.errorResponse = plaidErr
    req.errorStack = error.stack ?? null

    const errorCodeEnum =
        plaidErr.error_code.toUpperCase() as PlaidGeneralErrorCodeEnum
    if (Object.values(PlaidGeneralErrorCodeEnum).includes(errorCodeEnum)) {
        await handleGeneralPlaidError(errorCodeEnum, userId, itemId)
    }

    await queueLogPlaidApiRequest(req)
    throw new PlaidApiError(
        plaidErr.error_code,
        plaidErr.error_type,
        plaidErr.error_message
    )
}

const handleGeneralPlaidError = async (
    error: PlaidGeneralErrorCodeEnum,
    userId?: number,
    itemId?: number
) => {
    switch (error) {
        case PlaidGeneralErrorCodeEnum.RateLimitExceeded:
        case PlaidGeneralErrorCodeEnum.ProductsNotSupported:
        case PlaidGeneralErrorCodeEnum.InternalServerError:
        case PlaidGeneralErrorCodeEnum.AdditionalConsentRequired:
            logger.debug('no action required for error')
            break

        default: {
            if (userId === undefined || itemId === undefined) {
                throw new HttpError('missing user id or item id', 400)
            }

            const item = await fetchActiveItemByUserIdAndId(userId, itemId)
            if (!item) throw new HttpError('item not found', 404)

            switch (error) {
                case PlaidGeneralErrorCodeEnum.ItemLoginRequired:
                case PlaidGeneralErrorCodeEnum.AccessNotGranted: {
                    const message = `${item.institutionName} connection error`
                    await insertLinkUpdateNotification(item, message)
                    break
                }
                case PlaidGeneralErrorCodeEnum.NoAccounts: {
                    const message = `${item.institutionName} connection error`
                    await insertLinkUpdateWithAccountsNotification(
                        item,
                        message
                    )
                    break
                }
                case PlaidGeneralErrorCodeEnum.InstitutionNotResponding:
                case PlaidGeneralErrorCodeEnum.InstitutionDown: {
                    const message = `${item.institutionName} is experiencing issues. Try again later`
                    await insertInfoNotification(item, message)
                    break
                }
            }
        }
    }
}
