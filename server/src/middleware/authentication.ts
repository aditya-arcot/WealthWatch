import { HttpError } from '@models'
import { NextFunction, Request, Response } from 'express'

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
