// 3 hours
export const refreshCooldown = 1000 * 60 * 60 * 3

export const isInCooldown = (lastRefreshTimestamp: Date | null) => {
    if (!lastRefreshTimestamp) return false
    const timeDiff = Date.now() - new Date(lastRefreshTimestamp).getTime()
    return timeDiff < refreshCooldown
}
