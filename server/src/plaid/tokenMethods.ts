import {
    CountryCode,
    ItemPublicTokenExchangeRequest,
    LinkTokenCreateRequest,
    Products as PlaidProducts,
    SandboxPublicTokenCreateRequest,
} from 'plaid'
import { Item, User } from 'wealthwatch-shared'
import { vars } from '../utilities/env.js'
import { logger } from '../utilities/logger.js'
import { executePlaidMethod, getPlaidClient } from './index.js'

export const plaidLinkTokenCreate = async (
    userId: number,
    item?: Item,
    updateAccounts = false
) => {
    logger.debug(
        { itemId: item?.id, userId, updateAccounts },
        'creating link token'
    )

    let accessToken = null
    // balance product automatically included
    let products = [PlaidProducts.Transactions]
    let requiredIfSupportedProducts = [
        PlaidProducts.Investments,
        PlaidProducts.Liabilities,
    ]

    // link update mode
    if (item !== undefined) {
        accessToken = item.accessToken
        products = []
        requiredIfSupportedProducts = []
    }

    const params: LinkTokenCreateRequest = {
        /* eslint-disable @typescript-eslint/naming-convention */
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
        webhook: vars.plaidWebhookUrl,
        update: {
            account_selection_enabled: updateAccounts,
        },
        /* eslint-enable @typescript-eslint/naming-convention */
    }

    const resp = await executePlaidMethod(
        getPlaidClient().linkTokenCreate,
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

    // eslint-disable-next-line @typescript-eslint/naming-convention
    const params: ItemPublicTokenExchangeRequest = { public_token: publicToken }
    const resp = await executePlaidMethod(
        getPlaidClient().itemPublicTokenExchange,
        params,
        userId
    )
    return {
        accessToken: resp.data.access_token,
        plaidItemId: resp.data.item_id,
    }
}

export const plaidSandboxPublicTokenCreate = async (
    user: User,
    institutionId: string
) => {
    logger.debug({ userId: user.id, institutionId }, 'creating public token')

    const lastYear = new Date()
    lastYear.setFullYear(lastYear.getFullYear() - 1)

    const year = lastYear.getFullYear()
    const month = String(lastYear.getMonth() + 1).padStart(2, '0')
    const day = String(lastYear.getDate()).padStart(2, '0')
    const startDate = `${year}-${month}-${day}`

    const params: SandboxPublicTokenCreateRequest = {
        /* eslint-disable @typescript-eslint/naming-convention */
        institution_id: institutionId,
        initial_products: [PlaidProducts.Transactions],
        options: {
            webhook: vars.plaidWebhookUrl,
            transactions: {
                start_date: startDate,
            },
        },
        /* eslint-enable @typescript-eslint/naming-convention */
    }
    const resp = await executePlaidMethod(
        getPlaidClient().sandboxPublicTokenCreate,
        params,
        user.id
    )
    return resp.data.public_token
}
