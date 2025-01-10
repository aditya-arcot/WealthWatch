export interface TransactionsRequestParams {
    searchQuery: string
    startDate: Date | null
    endDate: Date | null
    minAmount: number | null
    maxAmount: number | null
    categoryIds?: Set<number>
    accountIds?: Set<number>
    limit: number
    offset: number
}
