export const formatDecimalToPercent = (
    decimal: number | null,
    precision = 1
): string => {
    if (decimal === null) return '-'
    return _formatPercent(decimal, precision)
}

export const formatPercent = (
    percent: number | null,
    precision = 1
): string => {
    if (percent === null) return '-'
    return _formatPercent(percent / 100, precision)
}

const _formatPercent = (num: number, precision: number): string => {
    const formatter: Intl.NumberFormat = new Intl.NumberFormat('en-US', {
        style: 'percent',
        minimumFractionDigits: precision,
        maximumFractionDigits: precision,
    })
    return formatter.format(num)
}

export const safeParseInt = (str: string): number | undefined => {
    const num = parseInt(str)
    if (isNaN(num)) return
    return num
}

export const safeParseFloat = (str: string): number | undefined => {
    const num = parseFloat(str)
    if (isNaN(num)) return
    return num
}

export const safeParseIntArrayOrUndefinedFromParam = (
    param: unknown
): number[] | undefined => {
    if (param === undefined) return
    if (typeof param === 'string') {
        const num = safeParseInt(param)
        if (num === undefined) return
        return [num]
    }
    if (Array.isArray(param)) {
        const nums: number[] = []
        param.forEach((p) => {
            if (typeof p !== 'string') return
            const num = safeParseInt(p)
            if (num === undefined) return
            nums.push(num)
        })
        return nums
    }
    return
}
