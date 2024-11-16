import { Account, AccountWithHoldings } from './account.js'

// 3 hours
const refreshCooldown = 1000 * 60 * 60 * 3
export const inCooldown = (timestamp: Date | null) => {
    if (!timestamp) return false
    return Date.now() - new Date(timestamp).getTime() < refreshCooldown
}

export interface Item {
    id: number
    userId: number
    plaidId: string
    active: boolean
    accessToken: string
    institutionId: string
    institutionName: string
    healthy: boolean
    cursor: string | null
    lastRefreshed: Date | null
    transactionsLastRefreshed: Date | null
    investmentsLastRefreshed: Date | null
}

export interface ItemWithAccounts extends Item {
    accounts: Account[]
}

export interface ItemWithAccountsWithHoldings extends Item {
    accounts: AccountWithHoldings[]
}
