import { getPool } from '@database/index.js'
import { AppRequest } from '@models/appRequest.js'
import { DatabaseError, HttpError, PlaidApiError } from '@models/error.js'
import { queueLogAppRequest } from '@queues/logQueue.js'
import { prod, stage, vars } from '@utilities/env.js'
import { logger } from '@utilities/logger.js'
import { capitalizeFirstLetter, createCookieName } from '@utilities/string.js'
import { ClientUrlEnum, ServerError } from '@wealthwatch-shared'
import pgSession from 'connect-pg-simple'
import _cors from 'cors'
import { randomInt } from 'crypto'
import { doubleCsrf } from 'csrf-csrf'
import { NextFunction, Request, RequestHandler, Response } from 'express'
import session from 'express-session'

export const cors = _cors({
    origin: prod ? (stage ? ClientUrlEnum.Stage : ClientUrlEnum.Prod) : true,
    credentials: true,
})

export const createSession = () => {
    const postgresSession = pgSession(session)
    const sessionStore = new postgresSession({
        pool: getPool(),
        createTableIfMissing: true,
    })
    return session({
        name: createCookieName('session'),
        store: sessionStore,
        secret: vars.sessionSecret,
        resave: false,
        saveUninitialized: true,
        cookie: {
            secure: prod,
            maxAge: 1000 * 60 * 60 * 24, // 1 day,
            sameSite: 'strict',
        },
    })
}

export const createCsrf = () => {
    const { doubleCsrfProtection } = doubleCsrf({
        getSecret: () => vars.sessionSecret,
        getSessionIdentifier: (req: Request) => req.sessionID,
        cookieName: createCookieName('csrf'),
        cookieOptions: {
            secure: prod,
            maxAge: 1000 * 60 * 60 * 24, // 1 day,
        },
    })
    return doubleCsrfProtection
}

export const logRequestResponse = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const timestamp = new Date()
    const requestId = `${timestamp.getTime().toString()}-${randomInt(0, 100)}`
    const appReq: AppRequest = {
        id: -1,
        requestId,
        userId: req.session?.user?.id ?? null,
        timestamp,
        duration: -1,
        method: req.method,
        url: req.baseUrl + req.path,
        queryParams: req.query,
        routeParams: req.params,
        requestHeaders: req.headers,
        requestBody: req.body,
        remoteAddress: req.socket.remoteAddress ?? null,
        remotePort: req.socket.remotePort ?? null,
        session: req.session,
        responseStatus: -1,
    }
    logger.info(`received request (id ${requestId}) - ${req.method} ${req.url}`)

    const send = res.send
    res.send = (body) => {
        // @ts-expect-error: custom property
        res._body = body
        res.send = send
        return res.send(body)
    }

    res.on('finish', () => {
        appReq.duration = Date.now() - appReq.timestamp.getTime()
        appReq.responseStatus = res.statusCode
        appReq.responseHeaders = res.getHeaders()
        // @ts-expect-error: custom property
        appReq.responseBody = res._body

        logger.info(`sending response (id ${requestId})`)
        queueLogAppRequest(appReq).catch((err) => {
            logger.error(err, 'failed to queue log app request')
        })
    })
    next()
}

export const catchAsync = (
    fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
): RequestHandler => {
    return (req: Request, res: Response, next: NextFunction): void => {
        fn(req, res, next).catch((err) => next(err))
    }
}

export const authenticate = (
    req: Request,
    _res: Response,
    next: NextFunction
) => {
    if (req.session && req.session.user) {
        return next()
    }
    throw new HttpError('Unauthorized', 401)
}

export const authenticateAdmin = (
    req: Request,
    _res: Response,
    next: NextFunction
) => {
    if (req.session && req.session.user && req.session.user.admin) {
        return next()
    }
    throw new HttpError('Unauthorized', 401)
}

export const handleUnmatchedRoute = (
    req: Request,
    _res: Response,
    _next: NextFunction
) => {
    throw new HttpError(`Endpoint not found - ${req.url}`, 404)
}

export const handleError = (
    err: Error & { code?: number | string },
    _req: Request,
    res: Response,
    _next: NextFunction
) => {
    logger.error({ err }, 'handling error')
    const status = getErrorStatus(err)
    const message = createErrorMessage(err)
    const code = err.code
    const error: ServerError = { message }
    error.code = String(code)
    logger.error({ status, code, error }, 'sending error response')
    res.status(status).json(error)
}

const getErrorStatus = (
    err: Error & {
        status?: number
        statusCode?: number
        code?: number | string
    }
): number => {
    let status = 500
    if (err instanceof HttpError) status = err.status
    else if (typeof err.status === 'number') status = err.status
    else if (typeof err.statusCode === 'number') status = err.statusCode
    else if (typeof err.code === 'number') status = err.code
    // error status codes are 4xx and 5xx
    if (status < 400 || status >= 600) status = 500
    return status
}

const createErrorMessage = (err: Error): string => {
    if (err instanceof HttpError)
        return formatErrorMessage('HTTP Error', err.message)
    if (err instanceof DatabaseError)
        return formatErrorMessage('Database Error', err.message)
    if (err instanceof PlaidApiError)
        return formatErrorMessage('Plaid Error', err.message, err.detail)
    // err.message is not always defined
    return err.message?.length
        ? capitalizeFirstLetter(err.message)
        : 'Unexpected Error'
}

const formatErrorMessage = (type: string, ...details: string[]): string => {
    if (prod || !details[0]?.length) return capitalizeFirstLetter(type)
    const detail = details.map((m) => capitalizeFirstLetter(m)).join(' - ')
    return `${capitalizeFirstLetter(type)} - ${detail}`
}

export const _test = { getErrorStatus, createErrorMessage, formatErrorMessage }
