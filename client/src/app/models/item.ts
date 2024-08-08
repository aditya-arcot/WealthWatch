import { Account } from './account'

// 3 hours
export const refreshCooldown = 1000 * 60 * 60 * 3

export interface Item {
    id: number
    userId: number
    itemId: string
    active: boolean
    accessToken: string
    institutionId: string
    institutionName: string
    healthy: boolean
    cursor: string | null
    lastSynced: Date | null
    lastRefreshed: Date | null
}

export interface ItemWithAccounts extends Item {
    accounts: Account[]
}
