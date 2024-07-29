import pgSession from 'connect-pg-simple'
import cors from 'cors'
import { randomUUID } from 'crypto'
import { doubleCsrf } from 'csrf-csrf'
import { NextFunction, Request, Response } from 'express'
import session from 'express-session'
import { env } from 'process'
import { HttpError } from '../models/httpError.js'
import { getPool } from './database.js'
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
    const id = randomUUID()
    const requestLog = {
        id,
        method: req.method,
        url: req.url,
        query: req.query,
        params: req.params,
        headers: req.headers,
        session: req.session,
        body: req.body,
        remoteAddress: req.socket.remoteAddress,
        remotePort: req.socket.remotePort,
    }
    logger.info({ requestLog }, 'received request')

    const send = res.send
    res.send = (body) => {
        // @ts-expect-error: custom property
        res._body = body
        res.send = send
        return res.send(body)
    }
    res.on('finish', () => {
        const responseLog = {
            id,
            statusCode: res.statusCode,
            headers: res.getHeaders(),
            // @ts-expect-error: custom property
            body: res._body,
        }
        logger.info({ responseLog }, 'sending response')
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
