import { SecurityTypeEnum } from 'wealthwatch-shared'

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
