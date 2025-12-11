import { HttpError } from '@models'
import { NextFunction, Request, Response } from 'express'

export const authenticate = (
    req: Request,
    _res: Response,
    next: NextFunction
) => {
    if (req.session.user) {
        next()
        return
    }
    throw new HttpError('Unauthorized', 401)
}

export const authenticateAdmin = (
    req: Request,
    _res: Response,
    next: NextFunction
) => {
    if (req.session.user?.admin) {
        next()
        return
    }
    throw new HttpError('Unauthorized', 401)
}
