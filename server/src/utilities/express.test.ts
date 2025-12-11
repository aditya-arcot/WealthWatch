import { HttpError } from '@models'
import { validate } from '@utilities'
import { describe, expect, it, vi } from 'vitest'
import * as z from 'zod'

const expectHttpError = (message: string, status: number) =>
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    expect.toSatisfy((err: HttpError) => {
        expect(err.message).toBe(message)
        expect(err.status).toBe(status)
        return true
    })

vi.mock('./logger', () => ({
    logger: {
        error: vi.fn(),
    },
}))

describe('validate', () => {
    const schema = z.object({
        foo: z.string(),
    })

    it('returns valid object', () => {
        const obj = { foo: 'bar' }
        expect(validate(obj, schema)).toMatchObject(obj)
    })

    it('throws error for invalid object', () => {
        const obj = { foo: 1 }
        expect(() => validate(obj, schema)).toThrow(
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            expectHttpError('invalid request', 400)
        )
    })
})
