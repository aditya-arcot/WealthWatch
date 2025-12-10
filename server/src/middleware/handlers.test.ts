import { HttpError } from '@models'
import { EnvNameEnum } from '@wealthwatch-shared'
import type { NextFunction, Request, Response } from 'express'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const expectHttpError = (message: string, status: number) =>
    expect.toSatisfy((err: HttpError) => {
        expect(err.message).toBe(message)
        expect(err.status).toBe(status)
        return true
    })

beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
})

describe('catchAsync', () => {
    const req = {} as Request
    const res = {} as Response
    const next: NextFunction = vi.fn()

    it('calls next with error if handler rejects', async () => {
        const { catchAsync } = await import('./handlers.js')
        const error = new Error('test error')
        const asyncHandler = vi.fn().mockRejectedValue(error)

        const wrapped = catchAsync(asyncHandler)
        await wrapped(req, res, next)

        expect(asyncHandler).toHaveBeenCalledExactlyOnceWith(req, res, next)
        expect(next).toHaveBeenCalledExactlyOnceWith(error)
    })

    it('does not call next if handler resolves', async () => {
        const { catchAsync } = await import('./handlers.js')
        const asyncHandler = vi.fn().mockResolvedValue(undefined)

        const wrapped = catchAsync(asyncHandler)
        await wrapped(req, res, next)

        expect(asyncHandler).toHaveBeenCalledExactlyOnceWith(req, res, next)
        expect(next).not.toHaveBeenCalled()
    })
})

describe('handleUnmatchedRoute', () => {
    const mockUrl = '/mock-url'

    const req = { url: mockUrl } as Request
    const res = {} as Response
    const next: NextFunction = vi.fn()

    it('throws 404 error for unmatched route', async () => {
        const { handleUnmatchedRoute } = await import('./handlers.js')
        expect(() => handleUnmatchedRoute(req, res, next)).toThrow(
            expectHttpError(`Endpoint not found - ${mockUrl}`, 404)
        )
        expect(next).not.toHaveBeenCalled()
    })
})

describe('handleError', () => {
    const mockCode = 'mock-code'
    const mockError = { code: mockCode } as Error & {
        code: string
    }

    const req = {} as Request
    const res: Partial<Response> = {
        json: vi.fn(),
        status: vi.fn().mockReturnThis(),
    }
    const next: NextFunction = vi.fn()

    beforeEach(() => {
        vi.doMock('../utilities/logger', () => ({
            logger: {
                error: vi.fn(),
            },
        }))
    })

    it('logs error and sends response', async () => {
        const { handleError } = await import('./handlers.js')
        const { logger } = await import('@utilities')

        handleError(mockError, req, res as Response, next)

        expect(logger.error).toHaveBeenCalledTimes(2)
        expect(logger.error).toHaveBeenNthCalledWith(
            1,
            { err: mockError },
            'handling error'
        )
        expect(logger.error).toHaveBeenNthCalledWith(
            2,
            expect.objectContaining({
                status: 500,
                code: mockCode,
                error: { message: 'Unexpected Error', code: mockCode },
            }),
            'sending error response'
        )

        expect(res.status).toHaveBeenCalledExactlyOnceWith(500)
        expect(res.json).toHaveBeenCalledExactlyOnceWith({
            message: 'Unexpected Error',
            code: mockCode,
        })
    })
})

describe('getErrorStatus', () => {
    it('returns status for generic error', async () => {
        const { _handlersTest } = await import('./handlers.js')
        const status = _handlersTest.getErrorStatus(new Error())
        expect(status).toBe(500)
    })

    it('returns status for HttpError', async () => {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        const { HttpError } = await import('@models')
        const { _handlersTest } = await import('./handlers.js')
        const mockCode = 400
        const status = _handlersTest.getErrorStatus(
            new HttpError('test', mockCode)
        )
        expect(status).toBe(mockCode)
    })

    it('returns status for error with status property', async () => {
        const mockCode = 401
        const error = { status: mockCode } as Error & {
            status: number
        }
        const { _handlersTest } = await import('./handlers.js')
        const status = _handlersTest.getErrorStatus(error)
        expect(status).toBe(mockCode)
    })

    it('returns status for error with statusCode property', async () => {
        const mockCode = 402
        const error = { statusCode: mockCode } as Error & {
            statusCode: number
        }
        const { _handlersTest } = await import('./handlers.js')
        const status = _handlersTest.getErrorStatus(error)
        expect(status).toBe(mockCode)
    })

    it('returns status for error with code property', async () => {
        const mockCode = 403
        const error = { code: mockCode } as Error & {
            code: number
        }
        const { _handlersTest } = await import('./handlers.js')
        const status = _handlersTest.getErrorStatus(error)
        expect(status).toBe(mockCode)
    })

    it('returns status for error with invalid status', async () => {
        const error = { status: 200 } as Error & {
            status: number
        }
        const { _handlersTest } = await import('./handlers.js')
        const status = _handlersTest.getErrorStatus(error)
        expect(status).toBe(500)
    })
})

describe('createErrorMessage', () => {
    it('creates HttpError message correctly', async () => {
        process.env['NODE_ENV'] = EnvNameEnum.Prod
        const { _handlersTest } = await import('./handlers.js')
        // eslint-disable-next-line @typescript-eslint/naming-convention
        const { HttpError } = await import('@models')
        const msg = _handlersTest.createErrorMessage(new HttpError(''))
        expect(msg).toBe('HTTP Error')
    })

    it('creates DatabaseError message correctly', async () => {
        process.env['NODE_ENV'] = EnvNameEnum.Prod
        const { _handlersTest } = await import('./handlers.js')
        // eslint-disable-next-line @typescript-eslint/naming-convention
        const { DatabaseError } = await import('@models')
        const msg = _handlersTest.createErrorMessage(new DatabaseError(''))
        expect(msg).toBe('Database Error')
    })

    it('creates PlaidApiError message correctly', async () => {
        process.env['NODE_ENV'] = EnvNameEnum.Prod
        const { _handlersTest } = await import('./handlers.js')
        // eslint-disable-next-line @typescript-eslint/naming-convention
        const { PlaidApiError } = await import('@models')
        const msg = _handlersTest.createErrorMessage(
            new PlaidApiError('', '', '')
        )
        expect(msg).toBe('Plaid Error')
    })

    it('creates generic empty error message correctly', async () => {
        process.env['NODE_ENV'] = EnvNameEnum.Prod
        const { _handlersTest } = await import('./handlers.js')
        const msg = _handlersTest.createErrorMessage(new Error())
        expect(msg).toBe('Unexpected Error')
    })

    it('creates generic error message correctly', async () => {
        process.env['NODE_ENV'] = EnvNameEnum.Prod
        const { _handlersTest } = await import('./handlers.js')
        const msg = _handlersTest.createErrorMessage(new Error('test'))
        expect(msg).toBe('Test')
    })
})

describe('formatErrorMessage', () => {
    it('formats message in non-prod', async () => {
        process.env['NODE_ENV'] = EnvNameEnum.Dev
        const { _handlersTest } = await import('./handlers.js')
        const msg = _handlersTest.formatErrorMessage(
            'category',
            'details 1',
            'details 2'
        )
        expect(msg).toBe('Category - Details 1 - Details 2')
    })

    it('formats message in prod', async () => {
        process.env['NODE_ENV'] = EnvNameEnum.Prod
        const { _handlersTest } = await import('./handlers.js')
        const msg = _handlersTest.formatErrorMessage('category', 'details')
        expect(msg).toBe('Category')
    })
})
