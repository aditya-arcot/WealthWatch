import {
    constructInsertQueryParamsPlaceholder,
    runQuery,
} from '@database/index.js'
import { Holding, HoldingWithSecurity } from '@wealthwatch-shared'

export const insertHoldings = async (holdings: Holding[]): Promise<void> => {
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
    `

    await runQuery(query, values)
}

/* eslint-disable @typescript-eslint/naming-convention */
export interface DbHoldingWithSecurity {
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
/* eslint-enable @typescript-eslint/naming-convention */

export const mapDbHoldingWithSecurity = (
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
