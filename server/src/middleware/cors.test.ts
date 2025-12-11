import { ClientUrlEnum, EnvNameEnum } from '@wealthwatch-shared'
import { NextFunction, Request, Response } from 'express'
import { beforeEach, describe, expect, it, vi } from 'vitest'

beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
})

describe('cors', () => {
    const req = {} as Request
    const res = {} as Response
    const next = vi.fn() as NextFunction

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call
    const mockCorsMiddleware = vi.fn((_req, _res, next) => next())
    const mockCorsFn = vi.fn(() => mockCorsMiddleware)

    beforeEach(() => {
        vi.doMock('cors', () => ({
            default: mockCorsFn,
        }))
    })

    const expectCors = async (nodeEnv: string) => {
        process.env['NODE_ENV'] = nodeEnv
        const { stage, prod } = await import('@utilities')
        const { cors } = await import('./cors.js')
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
