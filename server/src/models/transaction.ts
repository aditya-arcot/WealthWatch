export interface Transaction {
    id: number
    account_id: number
    category_id: number
    amount: number
    description: string
    timestamp: Date
}
