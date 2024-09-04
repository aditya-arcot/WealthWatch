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
