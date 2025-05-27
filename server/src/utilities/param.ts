import { ParsedQs } from 'qs'

export const parseNumberOrUndefinedFromParam = (
    param: string | ParsedQs | (string | ParsedQs)[] | undefined,
    nonNegative = false
): number | undefined => {
    if (param === undefined) return
    if (typeof param !== 'string') throw Error('invalid param')
    const num = Number(param)
    if (isNaN(num)) throw Error('invalid param')
    if (nonNegative && num < 0) throw Error('invalid param')
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
            throw Error('invalid number')
        }
        nums.push(num)
    } else if (Array.isArray(param)) {
        param.forEach((p) => {
            if (typeof p !== 'string') throw Error('invalid array')
            const num = Number(p)
            if (isNaN(num)) throw Error('invalid array')
            nums.push(num)
        })
    } else {
        throw Error('invalid param')
    }
    return nums
}
