export interface HoldingWithSecurity {
    id: number
    accountId: number
    name: string | null
    typeId: number
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
