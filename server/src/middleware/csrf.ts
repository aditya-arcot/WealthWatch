import { createCookieName, prod, vars } from '@utilities'
import { doubleCsrf } from 'csrf-csrf'
import { Request } from 'express'

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
