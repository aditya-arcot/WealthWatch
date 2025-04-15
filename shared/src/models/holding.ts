import { SecurityTypeEnum } from '../enums/security.js'

export interface Holding {
    id: number
    accountId: number
    securityId: number
    costBasis: number | null
    price: number
    priceAsOf: Date | null
    quantity: number
    value: number
    vestedQuantity: number | null
    vestedValue: number | null
    isoCurrencyCode: string | null
    unofficialCurrencyCode: string | null
}

export interface HoldingWithSecurity {
    id: number
    accountId: number
    name: string | null
    typeId: SecurityTypeEnum
    cashEquivalent: boolean
    ticker: string | null
    marketCode: string | null
    price: number
    priceAsOf: Date | null
    closePrice: number | null
    closePriceAsOf: Date | null
    quantity: number
    value: number
    costBasis: number | null
    isoCurrencyCode: string | null
    unofficialCurrencyCode: string | null
}
