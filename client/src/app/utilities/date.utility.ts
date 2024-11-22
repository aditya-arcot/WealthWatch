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

export const formatDate = (date: Date | null, includeTime = true): string => {
    if (date === null) return '-'
    const options: Intl.DateTimeFormatOptions = {
        month: 'numeric',
        day: 'numeric',
        year: '2-digit',
    }
    if (includeTime) {
        options.hour = 'numeric'
        options.minute = 'numeric'
    }
    return new Date(date).toLocaleString(undefined, options)
}
