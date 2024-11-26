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

export const parseNumberArrayOrUndefinedFromParam = (
    param: unknown
): number[] | undefined => {
    if (param === undefined) return
    if (typeof param === 'string') {
        const num = Number(param)
        if (isNaN(num)) return
        return [num]
    }
    if (Array.isArray(param)) {
        const nums: number[] = []
        param.forEach((p) => {
            if (typeof p !== 'string') return
            const num = Number(p)
            if (isNaN(num)) return
            nums.push(num)
        })
        return nums
    }
    return
}
