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

export const securityTypeNames: Record<SecurityTypeEnum, string> = {
    [SecurityTypeEnum.Cash]: 'Cash',
    [SecurityTypeEnum.Cryptocurrency]: 'Cryptocurrency',
    [SecurityTypeEnum.Derivative]: 'Derivative',
    [SecurityTypeEnum.Equity]: 'Equity',
    [SecurityTypeEnum.ETF]: 'ETF',
    [SecurityTypeEnum.FixedIncome]: 'Fixed Income',
    [SecurityTypeEnum.Loan]: 'Loan',
    [SecurityTypeEnum.MutualFund]: 'Mutual Fund',
    [SecurityTypeEnum.Other]: 'Other',
}
