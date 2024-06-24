import pgSession from 'connect-pg-simple'
import cors from 'cors'
import { randomUUID } from 'crypto'
import { NextFunction, Request, Response } from 'express'
import session from 'express-session'
import { env, exit } from 'process'
import { ExpressError } from '../models/expressError.js'
import { getPool } from './database.js'
import { logger } from './logger.js'

export const handleCors = cors({
    origin: 'http://localhost:4200',
})

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

export const configureSession = () => {
    if (!env['SESSION_SECRET']) {
        logger.fatal('missing session secret')
        exit(1)
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
            maxAge: 1000 * 60 * 60 * 24, // 1 day
        },
    })
}

export const handleError = (
    err: Error,
    _req: Request,
    res: Response,
    _next: NextFunction
): Response => {
    logger.error(err, err.message)
    if (err instanceof ExpressError) {
        return res.status(err.statusCode).send(err.message)
    } else {
        return res.status(500).send(err.message)
    }
}
