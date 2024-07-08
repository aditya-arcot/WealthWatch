import { CountryCode, PlaidApi, Products } from 'plaid'
import { runQuery } from '../utils/database.js'
import { HttpError } from './httpError.js'

export interface LinkToken {
    expiration: string
    linkToken: string
    requestId: string
}

export interface AccessToken {
    accessToken: string
    itemId: string
    requestId: string
}

export interface PlaidItem {
    id: string
    accessToken: string
    institutionId: string
    institutionName: string
    userId: number
}

interface DbPlaidItem {
    id: string
    access_token: string
    institution_id: string
    institution_name: string
    user_id: number
}

export const createLinkTokenByUser = async (
    userId: number,
    client: PlaidApi
): Promise<LinkToken> => {
    const resp = await client.linkTokenCreate({
        user: {
            client_user_id: userId.toString(),
        },
        client_name: 'WealthWatch',
        language: 'en',
        country_codes: [CountryCode.Us],
        // balance automatically included
        products: [Products.Transactions],
        required_if_supported_products: [
            Products.Investments,
            Products.Liabilities,
        ],
        transactions: {
            days_requested: 365,
        },
    })
    return {
        expiration: resp.data.expiration,
        linkToken: resp.data.link_token,
        requestId: resp.data.request_id,
    }
}

export const exchangePublicToken = async (
    publicToken: string,
    client: PlaidApi
) => {
    const resp = await client.itemPublicTokenExchange({
        public_token: publicToken,
    })
    return {
        accessToken: resp.data.access_token,
        itemId: resp.data.item_id,
        requestId: resp.data.request_id,
    }
}

const mapDbItemToItem = (dbItem: DbPlaidItem): PlaidItem => ({
    id: dbItem.id,
    accessToken: dbItem.access_token,
    institutionId: dbItem.institution_id,
    institutionName: dbItem.institution_name,
    userId: dbItem.user_id,
})

export const fetchItemsByUser = async (
    userId: number
): Promise<PlaidItem[]> => {
    const query = `
        SELECT * FROM items
        WHERE user_id = $1
    `
    const rows: DbPlaidItem[] = (await runQuery(query, [userId])).rows
    return rows.map(mapDbItemToItem)
}

export const createItem = async (item: PlaidItem) => {
    if (
        !item.id ||
        !item.accessToken ||
        !item.institutionId ||
        !item.institutionName ||
        !item.userId
    ) {
        throw new HttpError('missing item data', 400)
    }
    const query =
        'INSERT INTO items (id, access_token, institution_id, institution_name, user_id) VALUES ($1, $2, $3, $4, $5)'
    await runQuery(query, [
        item.id,
        item.accessToken,
        item.institutionId,
        item.institutionName,
        item.userId,
    ])
}
