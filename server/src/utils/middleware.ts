import pgSession from 'connect-pg-simple'
import cors from 'cors'
import { doubleCsrf } from 'csrf-csrf'
import { NextFunction, Request, Response } from 'express'
import session from 'express-session'
import { env } from 'process'
import { getPool } from '../database/index.js'
import { AppRequest } from '../models/appRequest.js'
import { HttpError } from '../models/httpError.js'
import { queueAppRequestLog } from '../queues/logQueue.js'
import { logger } from './logger.js'

export const production = env['NODE_ENV'] === 'prod'

const origins = [
    'https://wealthwatch.aditya-arcot.com',
    `http://localhost:${env['CLIENT_PORT']}`,
]
export const corsMiddleware = cors({
    origin: production ? origins : true,
    credentials: true,
})

export const createSessionMiddleware = () => {
    if (!env['SESSION_SECRET']) {
        throw Error('missing session secret')
    }
    const postgresSession = pgSession(session)
    const sessionStore = new postgresSession({
        pool: getPool(),
        createTableIfMissing: true,
    })
    return session({
        store: sessionStore,
        secret: env['SESSION_SECRET'],
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
    if (!env['CSRF_SECRET']) {
        throw Error('missing csrf secret')
    }
    const csrfSecret = env['CSRF_SECRET']
    const cookieName = production
        ? '__Host-psifi.x-csrf-token'
        : `x-csrf-token-${env['NODE_ENV']}`
    const options = {
        getSecret: () => csrfSecret,
        cookieName,
        cookieOptions: {
            secure: production,
            sameSite: production ? ('strict' as const) : ('lax' as const),
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
    const requestId = timestamp.getTime().toString()
    const appReq: AppRequest = {
        id: -1,
        requestId,
        userId: req.session?.user?.id ?? null,
        timestamp: new Date(),
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
    logger.info(`received request (id ${requestId})`)

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
        await queueAppRequestLog(appReq)
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
    throw new HttpError('unauthorized', 401)
}

export const handleUnmatchedRoute = (
    req: Request,
    _res: Response,
    _next: NextFunction
) => {
    throw new HttpError(`endpoint not found - ${req.url}`, 404)
}

export const handleError = (
    err: Error,
    _req: Request,
    res: Response,
    _next: NextFunction
): Response => {
    logger.error(err, err.message)
    if (err instanceof HttpError) {
        return res.status(err.statusCode).send(err.message)
    } else {
        return res.status(500).send(err.message)
    }
}
