import {
    constructInsertQueryParamsPlaceholder,
    runQuery,
} from '@database/index.js'
import { Security } from '@wealthwatch-shared'

export const insertSecurities = async (
    securities: Security[]
): Promise<void> => {
    if (!securities.length) return

    const values: unknown[] = []
    securities.forEach((security) => {
        values.push(
            security.plaidId,
            security.proxyPlaidId,
            security.institutionId,
            security.institutionSecurityId,
            security.name,
            security.typeId,
            security.ticker,
            security.marketCode,
            security.cashEquivalent,
            security.closePrice,
            security.closePriceAsOf,
            security.isoCurrencyCode,
            security.unofficialCurrencyCode
        )
    })

    const rowCount = securities.length
    const paramCount = Math.floor(values.length / rowCount)
    const query = `
        INSERT INTO securities
        (
            plaid_id,
            proxy_plaid_id,
            institution_id,
            institution_security_id,
            name,
            type_id,
            ticker,
            market_code,
            cash_equivalent,
            close_price,
            close_price_as_of,
            iso_currency_code,
            unofficial_currency_code
        )
        VALUES ${constructInsertQueryParamsPlaceholder(rowCount, paramCount)}
        ON CONFLICT (plaid_id)
        DO UPDATE SET
            proxy_plaid_id = EXCLUDED.proxy_plaid_id,
            institution_id = EXCLUDED.institution_id,
            institution_security_id = EXCLUDED.institution_security_id,
            name = EXCLUDED.name,
            type_id = EXCLUDED.type_id,
            ticker = EXCLUDED.ticker,
            market_code = EXCLUDED.market_code,
            cash_equivalent = EXCLUDED.cash_equivalent,
            close_price = EXCLUDED.close_price,
            close_price_as_of = EXCLUDED.close_price_as_of,
            iso_currency_code = EXCLUDED.iso_currency_code,
            unofficial_currency_code = EXCLUDED.unofficial_currency_code
    `

    await runQuery(query, values)
}

export const fetchSecurities = async (): Promise<Security[]> => {
    const query = 'SELECT * FROM securities'
    const rows = (await runQuery<DbSecurity>(query)).rows
    return rows.map(mapDbSecurity)
}

/* eslint-disable @typescript-eslint/naming-convention */
interface DbSecurity {
    id: number
    plaid_id: string
    proxy_plaid_id: string | null
    institution_id: string | null
    institution_security_id: string | null
    name: string | null
    type_id: number
    ticker: string | null
    market_code: string | null
    cash_equivalent: boolean
    close_price: number | null
    close_price_as_of: Date | null
    iso_currency_code: string | null
    unofficial_currency_code: string | null
}
/* eslint-enable @typescript-eslint/naming-convention */

const mapDbSecurity = (dbSecurity: DbSecurity): Security => ({
    id: dbSecurity.id,
    plaidId: dbSecurity.plaid_id,
    proxyPlaidId: dbSecurity.proxy_plaid_id,
    institutionId: dbSecurity.institution_id,
    institutionSecurityId: dbSecurity.institution_security_id,
    name: dbSecurity.name,
    typeId: dbSecurity.type_id,
    ticker: dbSecurity.ticker,
    marketCode: dbSecurity.market_code,
    cashEquivalent: dbSecurity.cash_equivalent,
    closePrice: dbSecurity.close_price,
    closePriceAsOf: dbSecurity.close_price_as_of,
    isoCurrencyCode: dbSecurity.iso_currency_code,
    unofficialCurrencyCode: dbSecurity.unofficial_currency_code,
})
