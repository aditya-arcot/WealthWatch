export interface TransactionsRequest {
    searchQuery?: string
    startDate?: Date | null
    endDate?: Date | null
    minAmount?: number | null
    maxAmount?: number | null
    categoryIds?: Set<number>
    accountIds?: Set<number>
    limit?: number
    offset?: number
}

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

export interface TransactionsResponse {
    totalCount: number
    filteredCount: number | null
    transactions: Transaction[]
}
