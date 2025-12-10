import { getPool } from '@database'
import { createCookieName, prod, vars } from '@utilities'
import pgSession from 'connect-pg-simple'
import { NextFunction, Request, Response } from 'express'
import session from 'express-session'

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
        saveUninitialized: false,
        cookie: {
            secure: prod,
            maxAge: 1000 * 60 * 60 * 24, // 1 day,
            sameSite: 'strict',
        },
    })
}

// initialize dummy property to prevent csrf mismatch
export const ensureSession = (
    req: Request,
    _res: Response,
    next: NextFunction
) => {
    if (req.session._dummy === undefined) req.session._dummy = true
    next()
}
