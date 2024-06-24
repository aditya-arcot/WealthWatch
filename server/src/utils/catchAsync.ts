import { NextFunction, Request, RequestHandler, Response } from 'express'

export const catchAsync = (
    fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
): RequestHandler => {
    return (req: Request, res: Response, next: NextFunction): void => {
        fn(req, res, next).catch((err) => next(err))
    }
}
