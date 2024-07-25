export interface Transaction {
    id: number
    accountId: number
    transactionId: string
    name: string
    amount: number
    merchant: string | null
    merchantId: string | null
    category: string | null
    detailedCategory: string | null
    paymentChannel: string
    isoCurrencyCode: string | null
    unofficialCurrencyCode: string | null
    date: Date
    pending: boolean
}
