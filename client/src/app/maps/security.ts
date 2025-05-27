import { SecurityTypeEnum } from 'wealthwatch-shared'

export const securityTypeNameMap: Record<SecurityTypeEnum, string> = {
    [SecurityTypeEnum.Cash]: 'Cash',
    [SecurityTypeEnum.Cryptocurrency]: 'Cryptocurrency',
    [SecurityTypeEnum.Derivative]: 'Derivative',
    [SecurityTypeEnum.Equity]: 'Equity',
    [SecurityTypeEnum.Etf]: 'ETF',
    [SecurityTypeEnum.FixedIncome]: 'Fixed Income',
    [SecurityTypeEnum.Loan]: 'Loan',
    [SecurityTypeEnum.MutualFund]: 'Mutual Fund',
    [SecurityTypeEnum.Other]: 'Other',
}
