import {
    AccountBase,
    AccountsBalanceGetRequest,
    AccountsGetRequest,
} from 'plaid'
import { Account } from '../models/account.js'
import { Item } from '../models/item.js'
import { toTitleCase } from '../utils/format.js'
import { logger } from '../utils/logger.js'
import { executePlaidMethod, plaidClient } from './index.js'

export const plaidAccountsGet = async (item: Item): Promise<Account[]> => {
    logger.debug({ item }, 'getting item accounts')
    const params: AccountsGetRequest = {
        access_token: item.accessToken,
    }
    const resp = await executePlaidMethod(
        plaidClient.accountsGet,
        params,
        item.userId,
        item.id
    )
    return resp.data.accounts.map((account) =>
        mapPlaidAccount(account, item.id)
    )
}

export const plaidAccountsBalanceGet = async (
    item: Item
): Promise<Account[]> => {
    logger.debug({ item }, 'getting item account balances')
    const params: AccountsBalanceGetRequest = {
        access_token: item.accessToken,
    }
    const resp = await executePlaidMethod(
        plaidClient.accountsBalanceGet,
        params,
        item.userId,
        item.id
    )
    return resp.data.accounts.map((account) =>
        mapPlaidAccount(account, item.id)
    )
}

export const mapPlaidAccount = (
    account: AccountBase,
    itemId: number
): Account => ({
    id: 0,
    itemId,
    plaidId: account.account_id,
    name: account.name,
    mask: account.mask,
    officialName: account.official_name,
    currentBalance: account.balances.current,
    availableBalance: account.balances.available,
    isoCurrencyCode: account.balances.iso_currency_code,
    unofficialCurrencyCode: account.balances.unofficial_currency_code,
    creditLimit: account.balances.limit,
    type: toTitleCase(account.type),
    subtype: mapAccountSubtype(account.subtype),
})

const mapAccountSubtype = (subtype: string | null): string | null => {
    if (subtype === null) return null

    if (plaidLowercaseSubtypes.includes(subtype)) return subtype.toLowerCase()
    if (plaidUppercaseSubtypes.includes(subtype)) return subtype.toUpperCase()

    if (subtype === 'paypal') return 'PayPal'
    if (subtype === 'line of credit') return 'Line of Credit'
    if (subtype === 'cash isa') return 'Cash ISA'
    if (subtype === 'non-custodial wallet') return 'Non-Custodial Wallet'
    if (subtype === 'non-taxable brokerage account')
        return 'Non-Taxable Brokerage Account'

    return toTitleCase(subtype)
}

const plaidLowercaseSubtypes = ['403B']

const plaidUppercaseSubtypes = [
    'hsa',
    'cd',
    'ebt',
    'gic',
    'hsa',
    'ira',
    'isa',
    'lif',
    'lira',
    'lrif',
    'lrsp',
    'prif',
    'qshr',
    'rdsp',
    'resp',
    'rlif',
    'rrif',
    'rrsp',
    'sarsep',
    'sep ira',
    'simple ira',
    'sipp',
    'tfsa',
    'ugma',
    'utma',
]
