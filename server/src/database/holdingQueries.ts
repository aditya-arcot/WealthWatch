import { Holding, HoldingWithSecurity } from '../models/holding.js'
import { constructInsertQueryParamsPlaceholder, runQuery } from './index.js'

export const insertHoldings = async (
    holdings: Holding[]
): Promise<Holding[] | undefined> => {
    if (!holdings.length) return

    const values: unknown[] = []
    holdings.forEach((holding) => {
        values.push(
            holding.accountId,
            holding.securityId,
            holding.costBasis,
            holding.price,
            holding.priceAsOf,
            holding.quantity,
            holding.value,
            holding.vestedQuantity,
            holding.vestedValue,
            holding.isoCurrencyCode,
            holding.unofficialCurrencyCode
        )
    })

    const rowCount = holdings.length
    const paramCount = Math.floor(values.length / rowCount)
    const query = `
        INSERT INTO holdings
        (
            account_id,
            security_id,
            cost_basis,
            price,
            price_as_of,
            quantity,
            value,
            vested_quantity,
            vested_value,
            iso_currency_code,
            unofficial_currency_code
        )
        VALUES ${constructInsertQueryParamsPlaceholder(rowCount, paramCount)}
        ON CONFLICT (account_id, security_id)
        DO UPDATE SET
            cost_basis = EXCLUDED.cost_basis,
            price = EXCLUDED.price,
            price_as_of = EXCLUDED.price_as_of,
            quantity = EXCLUDED.quantity,
            value = EXCLUDED.value,
            vested_quantity = EXCLUDED.vested_quantity,
            vested_value = EXCLUDED.vested_value,
            iso_currency_code = EXCLUDED.iso_currency_code,
            unofficial_currency_code = EXCLUDED.unofficial_currency_code
        RETURNING *
    `

    const rows = (await runQuery<DbHolding>(query, values)).rows
    if (!rows.length) return
    return rows.map(mapDbHolding)
}

export const fetchActiveHoldingsWithUserId = async (
    userId: number
): Promise<HoldingWithSecurity[]> => {
    const query = `
        SELECT
            h.id,
            h.account_id,
            s.name,
            s.type_id,
            s.cash_equivalent,
            s.ticker,
            s.market_code,
            h.price,
            h.price_as_of,
            s.close_price,
            s.close_price_as_of,
            h.quantity,
            h.value,
            h.cost_basis,
            h.iso_currency_code,
            h.unofficial_currency_code
        FROM holdings h
        JOIN securities s
        ON s.id = h.security_id
        WHERE
            h.account_id IN (
                SELECT id
                FROM accounts
                WHERE item_id IN (
                    SELECT id
                    FROM active_items
                    WHERE user_id = $1
                )
            )
        ORDER BY h.account_id, h.id
    `
    const rows = (await runQuery<DbHoldingWithSecurity>(query, [userId])).rows
    return rows.map(mapDbHoldingWithSecurity)
}

interface DbHolding {
    id: number
    account_id: number
    security_id: number
    cost_basis: number | null
    price: number
    price_as_of: Date | null
    quantity: number
    value: number
    vested_quantity: number | null
    vested_value: number | null
    iso_currency_code: string | null
    unofficial_currency_code: string | null
}

const mapDbHolding = (holding: DbHolding): Holding => ({
    id: holding.id,
    accountId: holding.account_id,
    securityId: holding.security_id,
    costBasis: holding.cost_basis,
    price: holding.price,
    priceAsOf: holding.price_as_of,
    quantity: holding.quantity,
    value: holding.value,
    vestedQuantity: holding.vested_quantity,
    vestedValue: holding.vested_value,
    isoCurrencyCode: holding.iso_currency_code,
    unofficialCurrencyCode: holding.unofficial_currency_code,
})

interface DbHoldingWithSecurity {
    id: number
    account_id: number
    name: string | null
    type_id: number
    cash_equivalent: boolean
    ticker: string | null
    market_code: string | null
    price: number
    price_as_of: Date | null
    close_price: number | null
    close_price_as_of: Date | null
    quantity: number
    value: number
    cost_basis: number | null
    iso_currency_code: string | null
    unofficial_currency_code: string | null
}

const mapDbHoldingWithSecurity = (
    holding: DbHoldingWithSecurity
): HoldingWithSecurity => ({
    id: holding.id,
    accountId: holding.account_id,
    name: holding.name,
    typeId: holding.type_id,
    cashEquivalent: holding.cash_equivalent,
    ticker: holding.ticker,
    marketCode: holding.market_code,
    price: holding.price,
    priceAsOf: holding.price_as_of,
    closePrice: holding.close_price,
    closePriceAsOf: holding.close_price_as_of,
    quantity: holding.quantity,
    value: holding.value,
    costBasis: holding.cost_basis,
    isoCurrencyCode: holding.iso_currency_code,
    unofficialCurrencyCode: holding.unofficial_currency_code,
})
