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
    categoryId: number | null
    customCategoryId: number | null
    paymentChannel: string
    isoCurrencyCode: string | null
    unofficialCurrencyCode: string | null
    date: Date
    pending: boolean
}
