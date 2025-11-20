import {
    parseNumberArrayOrUndefinedFromParam,
    parseNumberOrUndefinedFromParam,
} from '@utilities'
import { ParsedQs } from 'qs'
import { describe, expect, it } from 'vitest'

const invalidParamError = 'invalid param'
const invalidNumError = 'invalid number'
const invalidArrError = 'invalid array'

describe('parseNumberOrUndefinedFromParam', () => {
    it('parses valid param', () => {
        const cases: [string | undefined, number | undefined][] = [
            ['123', 123],
            ['-123', -123],
            [undefined, undefined],
        ]
        cases.forEach((c) => {
            expect(parseNumberOrUndefinedFromParam(c[0])).toBe(c[1])
        })
    })

    it('throws error for invalid param', () => {
        const cases: [
            string | ParsedQs | (string | ParsedQs)[] | undefined,
            boolean,
        ][] = [
            [['123'], false],
            [['1-2'], false],
            ['abc', false],
            ['abc', false],
            ['-123', true],
            [[{ prop: 'val' }], false],
            [{ prop: 'val' }, false],
        ]
        cases.forEach((c) => {
            expect(() => parseNumberOrUndefinedFromParam(c[0], c[1])).toThrow(
                invalidParamError
            )
        })
    })
})

describe('parseNumberArrayOrUndefinedFromParam', () => {
    it('parses valid param', () => {
        const cases: [
            string | ParsedQs | (string | ParsedQs)[] | undefined,
            number[] | undefined,
        ][] = [
            ['123', [123]],
            ['-123', [-123]],
            [
                ['123', '456'],
                [123, 456],
            ],
            [
                ['-123', '-456'],
                [-123, -456],
            ],
            [[], []],
            [undefined, undefined],
        ]
        cases.forEach((c) => {
            expect(parseNumberArrayOrUndefinedFromParam(c[0])).toStrictEqual(
                c[1]
            )
        })
    })

    it('throws error for invalid param', () => {
        const cases = [
            '1-2',
            'abc',
            ['1-2'],
            ['abc'],
            [{ prop: 'val' }],
            { prop: 'val' },
        ]
        cases.forEach((c) => {
            const err = Array.isArray(c)
                ? invalidArrError
                : typeof c === 'object'
                  ? invalidParamError
                  : invalidNumError
            expect(() => parseNumberArrayOrUndefinedFromParam(c)).toThrow(err)
        })
    })
})
