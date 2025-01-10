import { CategoryEnum } from './category.js'

export interface Transaction {
    id: number
    accountId: number
    plaidId: string
    name: string
    customName: string | null
    amount: number
    primaryCategory: string | null
    detailedCategory: string | null
    categoryId: CategoryEnum
    customCategoryId: CategoryEnum | null
    paymentChannel: PaymentChannelEnum
    merchantId: string | null
    merchant: string | null
    location: string | null
    isoCurrencyCode: string | null
    unofficialCurrencyCode: string | null
    date: Date
    pending: boolean
    note: string | null
}

export interface TransactionsAndCounts {
    transactions: Transaction[]
    filteredCount: number | null
    totalCount: number
}

export enum PaymentChannelEnum {
    Online = 'online',
    InStore = 'in_store',
    Other = 'other',
}
