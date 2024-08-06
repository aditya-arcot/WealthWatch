export interface Transaction {
    id: number
    accountId: number
    transactionId: string
    merchantId: string | null
    merchant: string | null
    name: string
    customName: string | null
    amount: number
    categoryId: number | null
    primaryCategory: string | null
    detailedCategory: string | null
    paymentChannel: string
    isoCurrencyCode: string | null
    unofficialCurrencyCode: string | null
    date: Date
    pending: boolean
}
