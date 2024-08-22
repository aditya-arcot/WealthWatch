import {
    CountryCode,
    ItemPublicTokenExchangeRequest,
    LinkTokenCreateRequest,
    Products as PlaidProducts,
    SandboxPublicTokenCreateRequest,
} from 'plaid'
import { env } from 'process'
import { fetchActiveItemById } from '../database/itemQueries.js'
import { Item } from '../models/item.js'
import { User } from '../models/user.js'
import { logger } from '../utils/logger.js'
import { executePlaidMethod, plaidClient } from './index.js'

export const plaidLinkTokenCreate = async (
    userId: number,
    itemId?: string,
    accountsUpdate: boolean = false
): Promise<string> => {
    logger.debug({ itemId, userId, accountsUpdate }, 'creating link token')

    let accessToken = null
    // balance product automatically included
    let products = [PlaidProducts.Transactions]
    let requiredIfSupportedProducts = [
        PlaidProducts.Investments,
        PlaidProducts.Liabilities,
    ]

    let item: Item | undefined
    // link update mode
    if (itemId !== undefined) {
        item = await fetchActiveItemById(itemId)
        if (!item) throw Error('item not found')
        accessToken = item.accessToken
        products = []
        requiredIfSupportedProducts = []
    }

    const params: LinkTokenCreateRequest = {
        user: {
            client_user_id: userId.toString(),
        },
        client_name: 'WealthWatch',
        language: 'en',
        country_codes: [CountryCode.Us],
        products,
        required_if_supported_products: requiredIfSupportedProducts,
        transactions: {
            days_requested: 730, // max
        },
        access_token: accessToken,
        webhook: env['PLAID_WEBHOOK_URL'] ?? '',
        update: {
            account_selection_enabled: accountsUpdate,
        },
    }

    const resp = await executePlaidMethod(
        plaidClient.linkTokenCreate,
        params,
        userId,
        item?.id
    )
    return resp.data.link_token
}

export const plaidPublicTokenExchange = async (
    publicToken: string,
    userId: number
) => {
    logger.debug({ publicToken, userId }, 'exchanging public token')

    const params: ItemPublicTokenExchangeRequest = { public_token: publicToken }
    const resp = await executePlaidMethod(
        plaidClient.itemPublicTokenExchange,
        params,
        userId
    )
    return {
        accessToken: resp.data.access_token,
        itemId: resp.data.item_id,
    }
}

export const plaidSandboxPublicTokenCreate = async (
    user: User,
    institutionId: string
) => {
    logger.debug({ user, institutionId }, 'creating public token')

    const lastYear = new Date()
    lastYear.setFullYear(lastYear.getFullYear() - 1)

    const year = lastYear.getFullYear()
    const month = String(lastYear.getMonth() + 1).padStart(2, '0')
    const day = String(lastYear.getDate()).padStart(2, '0')
    const startDate = `${year}-${month}-${day}`

    const params: SandboxPublicTokenCreateRequest = {
        institution_id: institutionId,
        initial_products: [PlaidProducts.Transactions],
        options: {
            webhook: env['PLAID_WEBHOOK_URL'] ?? '',
            transactions: {
                start_date: startDate,
            },
        },
    }
    const resp = await executePlaidMethod(
        plaidClient.sandboxPublicTokenCreate,
        params,
        user.id
    )
    return resp.data.public_token
}
