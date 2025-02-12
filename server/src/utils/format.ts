import { ParsedQs } from 'qs'
import { HttpError } from '../models/error.js'

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

export const capitalizeFirstLetter = (str: string): string => {
    return str.charAt(0).toUpperCase() + str.slice(1)
}

export const toTitleCase = (str: string): string =>
    str
        .toLowerCase()
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')

export const parseNumberOrUndefinedFromParam = (
    param: string | ParsedQs | (string | ParsedQs)[] | undefined,
    nonNegative = false
): number | undefined => {
    if (param === undefined) return
    if (typeof param !== 'string') throw new HttpError('invalid param')
    const num = Number(param)
    if (isNaN(num)) throw new HttpError('invalid param')
    if (nonNegative && num < 0) throw new HttpError('invalid param')
    return num
}

export const parseNumberArrayOrUndefinedFromParam = (
    param: string | ParsedQs | (string | ParsedQs)[] | undefined
): number[] | undefined => {
    if (param === undefined) return
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
