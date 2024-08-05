import { AccountBase } from 'plaid'
import { Account } from '../models/account.js'

export const mapPlaidAccount = (
    account: AccountBase,
    itemId: number
): Account => {
    return {
        id: 0,
        itemId,
        accountId: account.account_id,
        name: account.name,
        mask: account.mask,
        officialName: account.official_name,
        currentBalance: account.balances.current,
        availableBalance: account.balances.available,
        isoCurrencyCode: account.balances.iso_currency_code,
        unofficialCurrencyCode: account.balances.unofficial_currency_code,
        creditLimit: account.balances.limit,
        type: account.type,
        subtype: account.subtype,
    }
}
