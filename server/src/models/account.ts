export interface Account {
    id: number
    itemId: number
    accountId: string
    name: string
    mask: string | null
    officialName: string | null
    currentBalance: number | null
    availableBalance: number | null
    isoCurrencyCode: string | null
    unofficialCurrencyCode: string | null
    creditLimit: number | null
    type: string
    subtype: string | null
}
