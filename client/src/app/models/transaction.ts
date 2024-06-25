export interface Transaction {
    id: number
    accountId: number
    categoryId: number
    amount: number
    description: string
    timestamp: Date
}
