export interface Transaction {
    id: number
    accountId: number
    plaidId: string
    merchantId: string | null
    merchant: string | null
    name: string
    customName: string | null
    amount: number
    primaryCategory: string | null
    detailedCategory: string | null
    categoryId: number
    customCategoryId: number | null
    paymentChannel: string
    isoCurrencyCode: string | null
    unofficialCurrencyCode: string | null
    date: Date
    pending: boolean
    note: string | null
}

export interface TransactionsWithCounts {
    transactions: Transaction[]
    filteredCount: number | null
    totalCount: number
}
