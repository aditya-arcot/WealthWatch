// 3 hours
export const itemRefreshCooldown = 1000 * 60 * 60 * 3

export const itemInCooldown = (timestamp: Date | null) => {
    if (!timestamp) return false
    return Date.now() - new Date(timestamp).getTime() < itemRefreshCooldown
}
