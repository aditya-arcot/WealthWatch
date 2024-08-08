import { Account } from './account'

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
}

export interface ItemWithAccounts extends Item {
    accounts: Account[]
}
