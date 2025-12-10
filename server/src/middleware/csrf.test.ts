import { EnvNameEnum } from '@wealthwatch-shared'
import { NextFunction, Request, Response } from 'express'
import { beforeEach, describe, expect, it, vi } from 'vitest'

beforeEach(() => {
    vi.clearAllMocks()
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
        const { prod, vars } = await import('@utilities')
        const { createCookieName } = await import('@utilities')
        const { createCsrf } = await import('./csrf.js')
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
