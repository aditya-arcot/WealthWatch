import { AxiosError, isAxiosError } from 'axios'
import { Configuration, PlaidApi, PlaidEnvironments, PlaidError } from 'plaid'
import { fetchActiveItemsByUserId } from '../database/itemQueries.js'
import {
    fetchActiveNotificationsByUserId,
    insertItemNotification,
} from '../database/notificationQueries.js'
import { HttpError, PlaidApiError } from '../models/error.js'
import { NotificationTypeEnum } from '../models/notification.js'
import {
    PlaidApiRequest,
    PlaidGeneralErrorCodeEnum,
} from '../models/plaidApiRequest.js'
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

        if (isAxiosError(error)) {
            // all errors should be Axios/Plaid errors
            return await handlePlaidError(
                error,
                req,
                method.name,
                userId,
                itemId
            )
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
    // all errors should be Axios/Plaid errors
    const plaidErr = error.response?.data as PlaidError
    logger.error(`${methodName} error - ${plaidErr.error_code}`)

    req.errorCode = plaidErr.error_code
    req.errorType = plaidErr.error_type
    req.errorMessage = plaidErr.error_message
    req.errorResponse = plaidErr

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
            logger.debug('no error-specific action needed')
            break

        case PlaidGeneralErrorCodeEnum.ItemLoginRequired:
        case PlaidGeneralErrorCodeEnum.AccessNotGranted:
            if (userId === undefined || itemId === undefined) {
                logger.error('no user id or item id')
            } else {
                await insertPersistentLinkUpdateNotification(
                    NotificationTypeEnum.LinkUpdate,
                    userId,
                    itemId
                )
            }
            break

        case PlaidGeneralErrorCodeEnum.NoAccounts:
            if (userId === undefined || itemId === undefined) {
                logger.error('no user id or item id')
            } else {
                await insertPersistentLinkUpdateNotification(
                    NotificationTypeEnum.LinkUpdateWithAccounts,
                    userId,
                    itemId
                )
            }
            break

        case PlaidGeneralErrorCodeEnum.InstitutionNotResponding:
        case PlaidGeneralErrorCodeEnum.InstitutionDown:
            if (userId === undefined || itemId === undefined) {
                logger.error('no user id or item id')
            } else {
                await insertInstitutionIssuesNotification(userId, itemId)
            }
            break
    }
}

const insertPersistentLinkUpdateNotification = async (
    type: NotificationTypeEnum,
    userId: number,
    itemId: number
) => {
    logger.debug(
        { type, userId, itemId },
        'inserting persistent link update notification'
    )

    const notifications = (
        await fetchActiveNotificationsByUserId(userId)
    ).filter((n) => n.typeId === type && n.itemId === itemId && n.persistent)

    const item = (await fetchActiveItemsByUserId(userId)).find(
        (i) => i.id === itemId
    )
    if (!item) {
        logger.error({ userId, itemId }, 'no matching item found')
        return
    }

    if (notifications.length !== 0) {
        logger.debug('persistent link update notification already exists')
    }

    if (notifications.length === 0) {
        const message = `${item.institutionName} connection error`
        if (!(await insertItemNotification(type, item, message, true))) {
            logger.error('failed to insert persistent link update notification')
            return
        }
    }
}

const insertInstitutionIssuesNotification = async (
    userId: number,
    itemId: number
) => {
    logger.debug(
        { userId, itemId },
        'inserting institution issues notification'
    )

    const item = (await fetchActiveItemsByUserId(userId)).find(
        (i) => i.id === itemId
    )
    if (!item) {
        logger.error({ userId, itemId }, 'no matching item found')
    } else {
        logger.debug('inserting institution issues notification')
        if (
            !(await insertItemNotification(
                NotificationTypeEnum.Info,
                item,
                `${item.institutionName} is experiencing issues. Try again later`
            ))
        ) {
            logger.error('failed to insert institution issues notification')
        }
    }
}
