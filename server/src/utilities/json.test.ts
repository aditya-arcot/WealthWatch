import { safeStringify } from '@utilities'
import { describe, expect, it } from 'vitest'

describe('safeStringify', () => {
    it('stringifies non-circular object', () => {
        const obj = { a: 1, b: 2 }
        expect(safeStringify(obj)).toBe(JSON.stringify(obj))
    })

    it('stringifies circular object', () => {
        const obj = { prop1: 0, prop2: {} }
        obj.prop2 = obj
        const parsed = JSON.parse(safeStringify(obj)) as {
            prop1: number
            prop2?: unknown
        }
        expect(() => JSON.stringify(obj)).toThrow()
        expect(() => safeStringify(obj)).not.toThrow()
        expect(parsed.prop1).toBe(0)
        expect(parsed.prop2).toBeUndefined()
    })
})
