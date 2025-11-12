import { ClientUrlEnum, EnvNameEnum } from '@wealthwatch-shared'
import type { NextFunction, Request, Response } from 'express'
import { Session } from 'express-session'
import { Socket } from 'node:net'
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest'
import { HttpError } from '../models/error.js'

beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
})

describe('cors', () => {
    const req = {} as Request
    const res = {} as Response
    const next: NextFunction = vi.fn()

    const mockCorsMiddleware = vi.fn((_req, _res, next) => next())
    const mockCorsFn = vi.fn(() => mockCorsMiddleware)

    beforeEach(() => {
        vi.doMock('cors', () => ({
            default: mockCorsFn,
        }))
    })

    const expectCors = async (nodeEnv: string) => {
        process.env['NODE_ENV'] = nodeEnv
        const { stage, prod } = await import('./env.js')
        const { cors } = await import('./middleware.js')
        cors(req, res, next)

        expect(mockCorsFn).toHaveBeenCalledExactlyOnceWith({
            origin: prod
                ? stage
                    ? ClientUrlEnum.Stage
                    : ClientUrlEnum.Prod
                : true,
            credentials: true,
        })
        expect(cors).toBe(mockCorsMiddleware)
        expect(next).toHaveBeenCalledOnce()
    }

    it('allows all origins for dev', async () => {
        await expectCors(EnvNameEnum.Dev)
    })

    it('allows all origins for test', async () => {
        await expectCors(EnvNameEnum.Test)
    })

    it('allows specific origin for stage', async () => {
        await expectCors(EnvNameEnum.Stage)
    })

    it('allows specific origin for prod', async () => {
        await expectCors(EnvNameEnum.Prod)
    })
})

describe('createSession', () => {
    const req = {} as Request
    const res = {} as Response
    const next: NextFunction = vi.fn()

    const mockPool = { dummy: true }
    const mockPgStoreInstance = { on: vi.fn() }
    const mockPgStoreFn = vi.fn((_: unknown) => mockPgStoreInstance)
    const mockSessionMiddleware = vi.fn((_req, _res, next) => next())
    const mockSessionFn = vi.fn(() => mockSessionMiddleware)

    beforeEach(() => {
        vi.resetModules()

        vi.doMock('../database/index', () => ({
            getPool: () => mockPool,
        }))
        vi.doMock('connect-pg-simple', () => ({
            default: () => {
                // eslint-disable-next-line @typescript-eslint/no-extraneous-class
                return class PgStore {
                    constructor(options: unknown) {
                        return mockPgStoreFn(options)
                    }
                }
            },
        }))
        vi.doMock('express-session', () => ({
            default: mockSessionFn,
        }))
    })

    const expectSession = async (nodeEnv: string) => {
        process.env['NODE_ENV'] = nodeEnv
        const { prod, vars } = await import('./env.js')
        const { createCookieName } = await import('./string.js')
        const { createSession } = await import('./middleware.js')
        const result = createSession()
        void result(req, res, next)

        expect(mockPgStoreFn).toHaveBeenCalledExactlyOnceWith(
            expect.objectContaining({ pool: mockPool })
        )
        expect(mockSessionFn).toHaveBeenCalledExactlyOnceWith(
            expect.objectContaining({
                name: createCookieName('session'),
                store: mockPgStoreInstance,
                secret: vars.sessionSecret,
                cookie: expect.objectContaining({ secure: prod }),
            })
        )
        expect(result).toBe(mockSessionMiddleware)
        expect(next).toHaveBeenCalledOnce()
    }

    it('configures session for dev', async () => {
        await expectSession(EnvNameEnum.Dev)
    })

    it('configures session for test', async () => {
        await expectSession(EnvNameEnum.Test)
    })

    it('configures session for stage', async () => {
        await expectSession(EnvNameEnum.Stage)
    })

    it('configures session for prod', async () => {
        await expectSession(EnvNameEnum.Prod)
    })
})

describe('createCsrf', () => {
    const req = {} as Request
    const res = {} as Response
    const next: NextFunction = vi.fn()

    const mockCsrfMiddleware = vi.fn((_req, _res, next) => next())
    const mockCsrfFn = vi.fn(() => ({
        doubleCsrfProtection: mockCsrfMiddleware,
    }))

    beforeEach(() => {
        vi.doMock('csrf-csrf', () => ({
            doubleCsrf: mockCsrfFn,
        }))
    })

    const expectCsrf = async (nodeEnv: string) => {
        process.env['NODE_ENV'] = nodeEnv
        const { prod, vars } = await import('./env.js')
        const { createCookieName } = await import('./string.js')
        const { createCsrf } = await import('./middleware.js')
        const result = createCsrf()
        void result(req, res, next)

        expect(mockCsrfFn).toHaveBeenCalledExactlyOnceWith(
            expect.objectContaining({
                getSecret: expect.any(Function),
                getSessionIdentifier: expect.any(Function),
                cookieName: createCookieName('csrf'),
                cookieOptions: expect.objectContaining({
                    secure: prod,
                }),
            })
        )

        const lastCall = mockCsrfFn.mock.lastCall as unknown[] | undefined
        if (!lastCall || lastCall.length !== 1)
            throw new Error('unexpected mock call structure')
        const config = lastCall[0] as {
            getSecret: () => string
            // eslint-disable-next-line @typescript-eslint/naming-convention
            getSessionIdentifier: (req: { sessionID: string }) => string
        }
        expect(config.getSecret()).toBe(vars.sessionSecret)
        const mockSessionId = 'mock-session-id'
        // eslint-disable-next-line @typescript-eslint/naming-convention
        expect(config.getSessionIdentifier({ sessionID: mockSessionId })).toBe(
            mockSessionId
        )

        expect(result).toBe(mockCsrfMiddleware)
        expect(next).toHaveBeenCalledOnce()
    }

    it('configures csrf for dev', async () => {
        await expectCsrf(EnvNameEnum.Dev)
    })

    it('configures csrf for test', async () => {
        await expectCsrf(EnvNameEnum.Test)
    })

    it('configures csrf for stage', async () => {
        await expectCsrf(EnvNameEnum.Stage)
    })

    it('configures csrf for prod', async () => {
        await expectCsrf(EnvNameEnum.Prod)
    })
})

describe('logRequestResponse', () => {
    const mockMethod = 'GET'
    const mockBaseUrl = '/api'
    const mockPath = '/mock-url'
    const mockUrl = mockBaseUrl + mockPath
    const mockQuery = { foo: 'bar' }
    const mockParams = { id: '1' }
    const mockReqBody = { reqKey: 'value' }
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const mockReqHeaders = { 'req-header': 'value' }
    const mockUserId = 123
    const mockSession = {
        user: { id: mockUserId },
    } as unknown as Session
    const mockRemoteAddress = '127.0.0.1'
    const mockRemotePort = 8080
    const mockSocket: Socket = {
        remoteAddress: mockRemoteAddress,
        remotePort: mockRemotePort,
    } as unknown as Socket
    const mockStatus = 200
    const mockResBody = { resKey: 'value' }
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const mockResHeaders = { 'res-header': 'value' }
    const mockError = new Error('queue failure')

    const req: Partial<Request> = {
        method: mockMethod,
        baseUrl: mockBaseUrl,
        path: mockPath,
        url: mockUrl,
        query: mockQuery,
        params: mockParams,
        body: mockReqBody,
        headers: mockReqHeaders,
        session: mockSession,
        socket: mockSocket,
    }
    const res: Partial<Response> = {
        statusCode: mockStatus,
        getHeaders: () => mockResHeaders,
        on: vi.fn(),
        send: vi.fn().mockReturnThis(),
    }
    const next: NextFunction = vi.fn()

    beforeEach(() => {
        vi.doMock('./logger', () => ({
            logger: {
                info: vi.fn(),
                error: vi.fn(),
            },
        }))
        vi.doMock('../queues/logQueue', () => ({
            queueLogAppRequest: vi.fn().mockResolvedValue(undefined),
        }))
    })

    it('logs request and response info', async () => {
        const { logRequestResponse } = await import('./middleware.js')
        const { queueLogAppRequest } = await import('../queues/logQueue.js')
        const { logger } = await import('./logger.js')

        logRequestResponse(req as Request, res as Response, next)

        const wrappedSend = res.send as unknown as (body: unknown) => unknown
        wrappedSend.call(res, mockResBody)
        // @ts-expect-error: custom property
        expect(res._body).toEqual(mockResBody)
        expect(res.send).toHaveBeenCalledExactlyOnceWith(mockResBody)

        const finishHandler = (res.on as Mock).mock.calls.find(
            ([event]) => event === 'finish'
        )?.[1]
        expect(finishHandler).toBeDefined()
        finishHandler?.()

        expect(logger.info).toHaveBeenCalledTimes(2)
        expect(logger.info).toHaveBeenNthCalledWith(
            1,
            expect.stringMatching(
                new RegExp(
                    `received request \\(id \\d+-\\d+\\) - ${mockMethod} ${mockUrl}`
                )
            )
        )
        expect(logger.info).toHaveBeenNthCalledWith(
            2,
            expect.stringMatching(/sending response \(id \d+-\d+\)/)
        )

        expect(queueLogAppRequest).toHaveBeenCalledExactlyOnceWith(
            expect.objectContaining({
                id: -1,
                requestId: expect.stringMatching(/^\d+-\d+$/),
                userId: mockUserId,
                timestamp: expect.any(Date),
                duration: expect.any(Number),
                method: mockMethod,
                url: mockUrl,
                queryParams: mockQuery,
                routeParams: mockParams,
                requestHeaders: mockReqHeaders,
                requestBody: mockReqBody,
                remoteAddress: mockRemoteAddress,
                remotePort: mockRemotePort,
                session: mockSession,
                responseStatus: mockStatus,
                responseHeaders: mockResHeaders,
                responseBody: mockResBody,
            })
        )

        expect(next).toHaveBeenCalledOnce()
    })

    it('handles missing optional fields', async () => {
        const { logRequestResponse } = await import('./middleware.js')
        const { queueLogAppRequest } = await import('../queues/logQueue.js')

        req.session = {} as unknown as Session
        req.socket = {} as unknown as Socket

        logRequestResponse(req as Request, res as Response, next)

        const wrappedSend = res.send as unknown as (body: unknown) => unknown
        wrappedSend.call(res, mockResBody)

        const finishHandler = (res.on as Mock).mock.calls.find(
            ([event]) => event === 'finish'
        )?.[1]
        finishHandler?.()

        expect(queueLogAppRequest).toHaveBeenCalledExactlyOnceWith(
            expect.objectContaining({
                userId: null,
                remoteAddress: null,
                remotePort: null,
            })
        )
    })

    it('handles errors in queueLogAppRequest', async () => {
        vi.doMock('../queues/logQueue', () => ({
            queueLogAppRequest: vi.fn().mockRejectedValue(mockError),
        }))

        const { logRequestResponse } = await import('./middleware.js')
        const { logger } = await import('./logger.js')

        logRequestResponse(req as Request, res as Response, next)

        const wrappedSend = res.send as unknown as (body: unknown) => unknown
        wrappedSend.call(res, mockResBody)

        const finishHandler = (res.on as Mock).mock.calls.find(
            ([event]) => event === 'finish'
        )?.[1]
        finishHandler?.()

        await new Promise(process.nextTick)

        expect(logger.error).toHaveBeenCalledExactlyOnceWith(
            mockError,
            'failed to queue log app request'
        )
    })
})

describe('catchAsync', () => {
    const req = {} as Request
    const res = {} as Response
    const next: NextFunction = vi.fn()

    it('calls next with error if handler rejects', async () => {
        const { catchAsync } = await import('./middleware.js')
        const error = new Error('test error')
        const asyncHandler = vi.fn().mockRejectedValue(error)

        const wrapped = catchAsync(asyncHandler)
        await wrapped(req, res, next)

        expect(asyncHandler).toHaveBeenCalledExactlyOnceWith(req, res, next)
        expect(next).toHaveBeenCalledExactlyOnceWith(error)
    })

    it('does not call next if handler resolves', async () => {
        const { catchAsync } = await import('./middleware.js')
        const asyncHandler = vi.fn().mockResolvedValue(undefined)

        const wrapped = catchAsync(asyncHandler)
        await wrapped(req, res, next)

        expect(asyncHandler).toHaveBeenCalledExactlyOnceWith(req, res, next)
        expect(next).not.toHaveBeenCalled()
    })
})

const expectHttpError = (message: string, status: number) =>
    expect.toSatisfy((err: HttpError) => {
        expect(err.message).toBe(message)
        expect(err.status).toBe(status)
        return true
    })

describe('authenticate', () => {
    const req = {} as Request
    const res = {} as Response
    const next: NextFunction = vi.fn()

    it('calls next if user exists', async () => {
        req.session = { user: { id: 1 } } as unknown as Session
        const { authenticate } = await import('./middleware.js')
        authenticate(req, res, next)
        expect(next).toHaveBeenCalledOnce()
    })

    it('throws error if no user', async () => {
        req.session = {} as unknown as Session
        const { authenticate } = await import('./middleware.js')
        expect(() => authenticate(req as Request, res, next)).toThrow(
            expectHttpError('Unauthorized', 401)
        )
        expect(next).not.toHaveBeenCalled()
    })
})

describe('authenticateAdmin', () => {
    const req = {} as Request
    const res = {} as Response
    const next: NextFunction = vi.fn()

    it('calls next if admin user exists', async () => {
        req.session = { user: { id: 1, admin: true } } as unknown as Session
        const { authenticateAdmin } = await import('./middleware.js')
        authenticateAdmin(req, res, next)
        expect(next).toHaveBeenCalledOnce()
    })

    it('throws error if user is not admin', async () => {
        req.session = { user: { id: 1, admin: false } } as unknown as Session
        const { authenticateAdmin } = await import('./middleware.js')
        expect(() => authenticateAdmin(req as Request, res, next)).toThrow(
            expectHttpError('Unauthorized', 401)
        )
        expect(next).not.toHaveBeenCalled()
    })

    it('throws error if no user', async () => {
        req.session = {} as unknown as Session
        const { authenticateAdmin } = await import('./middleware.js')
        expect(() => authenticateAdmin(req as Request, res, next)).toThrow(
            expectHttpError('Unauthorized', 401)
        )
        expect(next).not.toHaveBeenCalled()
    })
})

describe('handleUnmatchedRoute', () => {
    const mockUrl = '/mock-url'

    const req = { url: mockUrl } as Request
    const res = {} as Response
    const next: NextFunction = vi.fn()

    it('throws 404 error for unmatched route', async () => {
        const { handleUnmatchedRoute } = await import('./middleware.js')
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
        vi.doMock('./logger', () => ({
            logger: {
                error: vi.fn(),
            },
        }))
    })

    it('logs error and sends response', async () => {
        const { handleError } = await import('./middleware.js')
        const { logger } = await import('./logger.js')

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
        const { _test } = await import('./middleware.js')
        const status = _test.getErrorStatus(new Error())
        expect(status).toBe(500)
    })

    it('returns status for HttpError', async () => {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        const { HttpError } = await import('../models/error.js')
        const { _test } = await import('./middleware.js')
        const mockCode = 400
        const status = _test.getErrorStatus(new HttpError('test', mockCode))
        expect(status).toBe(mockCode)
    })

    it('returns status for error with status property', async () => {
        const mockCode = 401
        const error = { status: mockCode } as Error & {
            status: number
        }
        const { _test } = await import('./middleware.js')
        const status = _test.getErrorStatus(error)
        expect(status).toBe(mockCode)
    })

    it('returns status for error with statusCode property', async () => {
        const mockCode = 402
        const error = { statusCode: mockCode } as Error & {
            statusCode: number
        }
        const { _test } = await import('./middleware.js')
        const status = _test.getErrorStatus(error)
        expect(status).toBe(mockCode)
    })

    it('returns status for error with code property', async () => {
        const mockCode = 403
        const error = { code: mockCode } as Error & {
            code: number
        }
        const { _test } = await import('./middleware.js')
        const status = _test.getErrorStatus(error)
        expect(status).toBe(mockCode)
    })

    it('returns status for error with invalid status', async () => {
        const error = { status: 200 } as Error & {
            status: number
        }
        const { _test } = await import('./middleware.js')
        const status = _test.getErrorStatus(error)
        expect(status).toBe(500)
    })
})

describe('createErrorMessage', () => {
    it('creates HttpError message correctly', async () => {
        process.env['NODE_ENV'] = EnvNameEnum.Prod
        const { _test } = await import('./middleware.js')
        // eslint-disable-next-line @typescript-eslint/naming-convention
        const { HttpError } = await import('../models/error.js')
        const msg = _test.createErrorMessage(new HttpError(''))
        expect(msg).toBe('HTTP Error')
    })

    it('creates DatabaseError message correctly', async () => {
        process.env['NODE_ENV'] = EnvNameEnum.Prod
        const { _test } = await import('./middleware.js')
        // eslint-disable-next-line @typescript-eslint/naming-convention
        const { DatabaseError } = await import('../models/error.js')
        const msg = _test.createErrorMessage(new DatabaseError(''))
        expect(msg).toBe('Database Error')
    })

    it('creates PlaidApiError message correctly', async () => {
        process.env['NODE_ENV'] = EnvNameEnum.Prod
        const { _test } = await import('./middleware.js')
        // eslint-disable-next-line @typescript-eslint/naming-convention
        const { PlaidApiError } = await import('../models/error.js')
        const msg = _test.createErrorMessage(new PlaidApiError('', '', ''))
        expect(msg).toBe('Plaid Error')
    })

    it('creates generic empty error message correctly', async () => {
        process.env['NODE_ENV'] = EnvNameEnum.Prod
        const { _test } = await import('./middleware.js')
        const msg = _test.createErrorMessage(new Error())
        expect(msg).toBe('Unexpected Error')
    })

    it('creates generic error message correctly', async () => {
        process.env['NODE_ENV'] = EnvNameEnum.Prod
        const { _test } = await import('./middleware.js')
        const msg = _test.createErrorMessage(new Error('test'))
        expect(msg).toBe('Test')
    })
})

describe('formatErrorMessage', () => {
    it('formats message in non-prod', async () => {
        process.env['NODE_ENV'] = EnvNameEnum.Dev
        const { _test } = await import('./middleware.js')
        const msg = _test.formatErrorMessage(
            'category',
            'details 1',
            'details 2'
        )
        expect(msg).toBe('Category - Details 1 - Details 2')
    })

    it('formats message in prod', async () => {
        process.env['NODE_ENV'] = EnvNameEnum.Prod
        const { _test } = await import('./middleware.js')
        const msg = _test.formatErrorMessage('category', 'details')
        expect(msg).toBe('Category')
    })
})
