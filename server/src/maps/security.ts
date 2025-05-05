import { SecurityTypeEnum } from 'wealthwatch-shared'
import { PlaidSecurityTypeEnum } from '../enums/security.js'

export const securityTypeMap: Record<PlaidSecurityTypeEnum, SecurityTypeEnum> =
    {
        [PlaidSecurityTypeEnum.Cash]: SecurityTypeEnum.Cash,
        [PlaidSecurityTypeEnum.Cryptocurrency]: SecurityTypeEnum.Cryptocurrency,
        [PlaidSecurityTypeEnum.Derivative]: SecurityTypeEnum.Derivative,
        [PlaidSecurityTypeEnum.Equity]: SecurityTypeEnum.Equity,
        [PlaidSecurityTypeEnum.ETF]: SecurityTypeEnum.ETF,
        [PlaidSecurityTypeEnum.FixedIncome]: SecurityTypeEnum.FixedIncome,
        [PlaidSecurityTypeEnum.Loan]: SecurityTypeEnum.Loan,
        [PlaidSecurityTypeEnum.MutualFund]: SecurityTypeEnum.MutualFund,
        [PlaidSecurityTypeEnum.Other]: SecurityTypeEnum.Other,
    }
