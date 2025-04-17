import pgSession from 'connect-pg-simple'
import cors from 'cors'
import { randomInt } from 'crypto'
import { doubleCsrf } from 'csrf-csrf'
import { NextFunction, Request, Response } from 'express'
import session from 'express-session'
import { ServerError } from 'wealthwatch-shared'
import { getPool } from '../database/index.js'
import { AppRequest } from '../models/appRequest.js'
import { DatabaseError, HttpError, PlaidApiError } from '../models/error.js'
import { queueLogAppRequest } from '../queues/logQueue.js'
import { production, stage, vars } from './env.js'
import { capitalizeFirstLetter } from './format.js'
import { logger } from './logger.js'

const origins = [
    stage
        ? 'https://wealthwatch-stage.aditya-arcot.com'
        : 'https://wealthwatch.aditya-arcot.com',
]
export const corsMiddleware = cors({
    origin: production ? origins : true,
    credentials: true,
})

export const createSessionMiddleware = () => {
    const postgresSession = pgSession(session)
    const sessionStore = new postgresSession({
        pool: getPool(),
        createTableIfMissing: true,
    })
    const cookieName = production
        ? 'wealthwatch-session'
        : `wealthwatch-${vars.nodeEnv}-session`
    return session({
        name: cookieName,
        store: sessionStore,
        secret: vars.sessionSecret,
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: production,
            maxAge: 1000 * 60 * 60 * 24, // 1 day,
            sameSite: 'strict',
        },
    })
}

export const createCsrfMiddleware = () => {
    const cookieName = production
        ? 'wealthwatch-csrf-token'
        : `wealthwatch-${vars.nodeEnv}-csrf-token`
    const options = {
        getSecret: () => vars.sessionSecret,
        cookieName,
        cookieOptions: {
            secure: production,
            sameSite: 'strict' as const,
        },
    }
    const { doubleCsrfProtection } = doubleCsrf(options)
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
    err: Error,
    _req: Request,
    res: Response,
    _next: NextFunction
) => {
    logger.error({ err }, 'handling error')
    let status = err instanceof HttpError ? err.status : 500
    // error status codes are 4xx and 5xx
    if (status < 400 || status >= 600) status = 500
    const error = createErrorObject(err)
    logger.error({ status, error }, 'sending error response')
    res.status(status).json(error)
}

const createErrorObject = (err: Error): ServerError => {
    if (err instanceof HttpError) {
        const error: ServerError = {
            message: err.message,
        }
        if (err.code) error.code = err.code
        return error
    }
    if (err instanceof DatabaseError) {
        return { message: formatErrorMessage('Database Error', err.message) }
    }
    if (err instanceof PlaidApiError) {
        return {
            message: formatErrorMessage(
                'Plaid Error',
                err.message,
                err.code,
                err.detail
            ),
        }
    }
    return {
        message: formatErrorMessage('Unexpected Error', err.message),
    }
}

const formatErrorMessage = (category: string, ...messages: string[]) => {
    if (production) return category
    return `${category} - ${messages.map((m) => capitalizeFirstLetter(m)).join(' - ')}`
}
