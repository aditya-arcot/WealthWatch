import { ParsedQs } from 'qs'
import { HttpError } from '../models/httpError.js'

export const safeStringify = (obj: object) => {
    const seen = new WeakSet()
    return JSON.stringify(obj, (_key, value) => {
        if (typeof value === 'object' && value !== null) {
            if (seen.has(value)) {
                return
            }
            seen.add(value)
        }
        return value
    })
}

export const toTitleCase = (str: string): string =>
    str
        .toLowerCase()
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')

export const parseNumberOrUndefinedFromQueryParam = (
    param: string | string[] | ParsedQs | ParsedQs[] | undefined,
    nonNegative = false
): number | undefined => {
    if (param === undefined) return undefined
    if (typeof param !== 'string') throw new HttpError('invalid param')
    const num = Number(param)
    if (isNaN(num)) throw new HttpError('invalid param')
    if (nonNegative && num < 0) throw new HttpError('invalid param')
    return num
}

export const parseNumberArrayOrUndefinedFromQueryParam = (
    param: string | string[] | ParsedQs | ParsedQs[] | undefined
): number[] | undefined => {
    if (param === undefined) return undefined
    const nums: number[] = []
    if (typeof param === 'string') {
        const num = Number(param)
        if (isNaN(num)) {
            throw new HttpError('invalid number')
        }
        nums.push(num)
    } else if (Array.isArray(param)) {
        param.forEach((p) => {
            if (typeof p !== 'string') throw new HttpError('invalid array')
            const num = Number(p)
            if (isNaN(num)) throw new HttpError('invalid array')
            nums.push(num)
        })
    } else {
        throw new HttpError('invalid array')
    }
    return nums
}

export const parseNumberArrayFromBodyProp = (prop: unknown): number[] => {
    if (!Array.isArray(prop)) throw new HttpError('invalid array')
    if (prop.length === 0) return []
    return prop.map((num) => {
        if (typeof num !== 'number' || isNaN(num)) {
            throw new HttpError('invalid array')
        }
        return num
    })
}
