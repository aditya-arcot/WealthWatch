export const checkDatesEqual = (
    date1: Date | null | undefined,
    date2: Date | null | undefined
): boolean => {
    if (!date1) {
        return !date2
    }
    if (!date2) {
        return false
    }
    const zeroMsDate1 = new Date(date1)
    zeroMsDate1.setMilliseconds(0)
    const zeroMsDate2 = new Date(date2)
    zeroMsDate2.setMilliseconds(0)
    return zeroMsDate1.getTime() === zeroMsDate2.getTime()
}

export const formatDate = (
    date: Date | null,
    includeDate: boolean,
    includeTime: boolean
): string => {
    if (date === null) return '-'
    const options: Intl.DateTimeFormatOptions = {}
    if (includeDate) {
        options.month = 'numeric'
        options.day = 'numeric'
        options.year = '2-digit'
    }
    if (includeTime) {
        options.hour = 'numeric'
        options.minute = 'numeric'
    }
    return new Date(date).toLocaleString(undefined, options)
}

export const checkDateStringValid = (date: string): boolean => {
    const regex = /^\d{4}-\d{2}-\d{2}$/
    if (!regex.test(date)) return false
    return !isNaN(Date.parse(date))
}
