export interface Security {
    id: number
    plaidId: string
    proxyPlaidId: string | null
    institutionId: string | null
    institutionSecurityId: string | null
    name: string | null
    typeId: SecurityTypeEnum
    ticker: string | null
    marketCode: string | null
    cashEquivalent: boolean
    closePrice: number | null
    closePriceAsOf: Date | null
    isoCurrencyCode: string | null
    unofficialCurrencyCode: string | null
}

export enum SecurityTypeEnum {
    Cash = 1,
    Cryptocurrency,
    Derivative,
    Equity,
    ETF,
    FixedIncome,
    Loan,
    MutualFund,
    Other,
}
