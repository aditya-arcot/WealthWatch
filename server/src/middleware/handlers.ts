import { DatabaseError, HttpError, PlaidApiError } from '@models'
import { capitalizeFirstLetter, logger, prod } from '@utilities'
import { ServerError } from '@wealthwatch-shared'
import { NextFunction, Request, RequestHandler, Response } from 'express'

export const catchAsync = (
    fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
): RequestHandler => {
    return (req: Request, res: Response, next: NextFunction): void => {
        fn(req, res, next).catch((err) => next(err))
    }
}

export const handleUnmatchedRoute = (
    req: Request,
    _res: Response,
    _next: NextFunction
) => {
    throw new HttpError(`Endpoint not found - ${req.url}`, 404)
}

export const handleError = (
    err: Error & { code?: number | string },
    _req: Request,
    res: Response,
    _next: NextFunction
) => {
    logger.error({ err }, 'handling error')
    const status = getErrorStatus(err)
    const message = createErrorMessage(err)
    const code = err.code
    const error: ServerError = { message }
    error.code = String(code)
    logger.error({ status, code, error }, 'sending error response')
    res.status(status).json(error)
}

const getErrorStatus = (
    err: Error & {
        status?: number
        statusCode?: number
        code?: number | string
    }
): number => {
    let status = 500
    if (err instanceof HttpError) status = err.status
    else if (typeof err.status === 'number') status = err.status
    else if (typeof err.statusCode === 'number') status = err.statusCode
    else if (typeof err.code === 'number') status = err.code
    // error status codes are 4xx and 5xx
    if (status < 400 || status >= 600) status = 500
    return status
}

const createErrorMessage = (err: Error): string => {
    if (err instanceof HttpError)
        return formatErrorMessage('HTTP Error', err.message)
    if (err instanceof DatabaseError)
        return formatErrorMessage('Database Error', err.message)
    if (err instanceof PlaidApiError)
        return formatErrorMessage('Plaid Error', err.message, err.detail)
    // err.message is not always defined
    return err.message?.length
        ? capitalizeFirstLetter(err.message)
        : 'Unexpected Error'
}

const formatErrorMessage = (type: string, ...details: string[]): string => {
    if (prod || !details[0]?.length) return capitalizeFirstLetter(type)
    const detail = details.map((m) => capitalizeFirstLetter(m)).join(' - ')
    return `${capitalizeFirstLetter(type)} - ${detail}`
}

export const _handlersTest = {
    getErrorStatus,
    createErrorMessage,
    formatErrorMessage,
}
