import pgSession from 'connect-pg-simple'
import cors from 'cors'
import { randomInt } from 'crypto'
import { doubleCsrf } from 'csrf-csrf'
import { NextFunction, Request, Response } from 'express'
import session from 'express-session'
import { getPool } from '../database/index.js'
import { AppRequest } from '../models/appRequest.js'
import { HttpError } from '../models/httpError.js'
import { queueLogAppRequest } from '../queues/logQueue.js'
import { production, stage, vars } from './env.js'
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
    return session({
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
        ? '__Host-psifi.x-csrf-token'
        : `x-csrf-token-${vars.nodeEnv}`
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

    res.on('finish', async () => {
        appReq.duration = Date.now() - appReq.timestamp.getTime()
        appReq.responseStatus = res.statusCode
        appReq.responseHeaders = res.getHeaders()
        // @ts-expect-error: custom property
        appReq.responseBody = res._body

        logger.info(`sending response (id ${requestId})`)
        await queueLogAppRequest(appReq)
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
): Response => {
    logger.error(err, err.message)
    if (err instanceof HttpError) {
        return res
            .status(err.statusCode)
            .send(err.message.charAt(0).toUpperCase() + err.message.slice(1))
    } else {
        return res.status(500).send('Unexpected error')
    }
}
