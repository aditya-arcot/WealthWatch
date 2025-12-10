import { EnvNameEnum } from '@wealthwatch-shared'
import { NextFunction, Request, Response } from 'express'
import { Session } from 'express-session'
import { beforeEach, describe, expect, it, vi } from 'vitest'

beforeEach(() => {
    vi.clearAllMocks()
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
        const { prod, vars } = await import('@utilities')
        const { createCookieName } = await import('@utilities')
        const { createSession } = await import('./session.js')
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

describe('ensureSession', () => {
    const req = {} as Request
    const res = {} as Response
    const next: NextFunction = vi.fn()

    it('sets dummy property if not present', async () => {
        const { ensureSession } = await import('./session.js')
        req.session = {} as unknown as Session
        ensureSession(req, res, next)
        expect(req.session._dummy).toBe(true)
        expect(next).toHaveBeenCalledOnce()
    })

    it('does not set dummy property if already present', async () => {
        const { ensureSession } = await import('./session.js')
        req.session = { _dummy: false } as unknown as Session
        ensureSession(req, res, next)
        expect(req.session._dummy).toBe(false)
        expect(next).toHaveBeenCalledOnce()
    })
})
