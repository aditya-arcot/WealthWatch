import { HttpError } from '@models'
import { NextFunction, Request, Response } from 'express'
import { Session } from 'express-session'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const expectHttpError = (message: string, status: number) =>
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    expect.toSatisfy((err: HttpError) => {
        expect(err.message).toBe(message)
        expect(err.status).toBe(status)
        return true
    })

beforeEach(() => {
    vi.clearAllMocks()
})

describe('authenticate', () => {
    const req = {} as Request
    const res = {} as Response
    const next: NextFunction = vi.fn()

    it('calls next if user exists', async () => {
        req.session = { user: { id: 1 } } as unknown as Session
        const { authenticate } = await import('./authentication.js')
        authenticate(req, res, next)
        expect(next).toHaveBeenCalledOnce()
    })

    it('throws error if no user', async () => {
        req.session = {} as unknown as Session
        const { authenticate } = await import('./authentication.js')
        expect(() => {
            authenticate(req, res, next)
        }).toThrow(
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
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
        const { authenticateAdmin } = await import('./authentication.js')
        authenticateAdmin(req, res, next)
        expect(next).toHaveBeenCalledOnce()
    })

    it('throws error if user is not admin', async () => {
        req.session = { user: { id: 1, admin: false } } as unknown as Session
        const { authenticateAdmin } = await import('./authentication.js')
        expect(() => {
            authenticateAdmin(req, res, next)
        }).toThrow(
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            expectHttpError('Unauthorized', 401)
        )
        expect(next).not.toHaveBeenCalled()
    })

    it('throws error if no user', async () => {
        req.session = {} as unknown as Session
        const { authenticateAdmin } = await import('./authentication.js')
        expect(() => {
            authenticateAdmin(req, res, next)
        }).toThrow(
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            expectHttpError('Unauthorized', 401)
        )
        expect(next).not.toHaveBeenCalled()
    })
})
