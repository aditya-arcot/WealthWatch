export interface TransactionsRequest {
    searchQuery?: string | null
    startDate?: string | null
    endDate?: string | null
    limit?: number
    offset?: number
}

export interface Transaction {
    id: number
    accountId: number
    transactionId: string
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
}

export interface TransactionsResponse {
    totalCount: number
    filteredCount: number | null
    transactions: Transaction[]
}
