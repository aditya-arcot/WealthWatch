import {
    InvestmentsRefreshRequest,
    Holding as PlaidHolding,
    Security as PlaidSecurity,
} from 'plaid'
import { PlaidGeneralErrorCodeEnum } from '../enums/plaidError.js'
import { PlaidSecurityTypeEnum } from '../enums/security.js'
import { securityTypeMap } from '../maps/security.js'
import { PlaidApiError } from '../models/error.js'
import { logger } from '../utilities/logger.js'
import {
    Holding,
    Item,
    Security,
    SecurityTypeEnum,
} from '../wealthwatch-shared.js'
import { executePlaidMethod, getPlaidClient } from './index.js'

export const plaidInvestmentsRefresh = async (item: Item) => {
    logger.debug({ id: item.id }, 'refreshing item investments')

    const params: InvestmentsRefreshRequest = {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        access_token: item.accessToken,
    }

    try {
        await executePlaidMethod(
            getPlaidClient().investmentsRefresh,
            params,
            item.userId,
            item.id
        )
        return true
    } catch (error) {
        if (!(error instanceof PlaidApiError)) throw error
        if (error.code !== PlaidGeneralErrorCodeEnum.ProductsNotSupported)
            throw error
        logger.error(error)
        logger.debug(
            { id: item.id },
            'products not supported error. abandoning investments refresh'
        )
        return false
    }
}

interface InvestmentsHoldingsResponse {
    holdings: PlaidHolding[]
    securities: PlaidSecurity[]
}

export const plaidInvestmentsHoldingsGet = async (
    item: Item
): Promise<InvestmentsHoldingsResponse | undefined> => {
    logger.debug({ id: item.id }, 'getting item investment holdings')

    const params = {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        access_token: item.accessToken,
    }

    try {
        const resp = await executePlaidMethod(
            getPlaidClient().investmentsHoldingsGet,
            params,
            item.userId,
            item.id
        )
        return {
            holdings: resp.data.holdings,
            securities: resp.data.securities,
        }
    } catch (error) {
        if (!(error instanceof PlaidApiError)) throw error
        if (error.code !== PlaidGeneralErrorCodeEnum.ProductsNotSupported)
            throw error
        logger.error(error)
        logger.debug(
            { id: item.id },
            'products not supported error. abandoning investment holdings get'
        )
        return
    }
}

export const mapPlaidSecurity = (security: PlaidSecurity): Security => ({
    id: -1,
    plaidId: security.security_id,
    proxyPlaidId: security.proxy_security_id,
    institutionId: security.institution_id,
    institutionSecurityId: security.institution_security_id,
    name: security.name,
    typeId: mapPlaidSecurityType(security.type),
    ticker: security.ticker_symbol,
    marketCode: security.market_identifier_code,
    cashEquivalent: security.is_cash_equivalent ?? false,
    closePrice: security.close_price,
    closePriceAsOf: security.update_datetime
        ? new Date(security.update_datetime)
        : security.close_price_as_of
          ? new Date(security.close_price_as_of)
          : null,
    isoCurrencyCode: security.iso_currency_code,
    unofficialCurrencyCode: security.unofficial_currency_code,
})

export const mapPlaidHolding = (
    holding: PlaidHolding,
    accountId: number,
    securityId: number
): Holding => ({
    id: -1,
    accountId,
    securityId,
    costBasis: holding.cost_basis,
    price: holding.institution_price,
    priceAsOf: holding.institution_price_as_of
        ? new Date(holding.institution_price_as_of)
        : null,
    quantity: holding.quantity,
    value: holding.institution_value,
    vestedQuantity: holding.vested_quantity ?? null,
    vestedValue: holding.vested_value ?? null,
    isoCurrencyCode: holding.iso_currency_code,
    unofficialCurrencyCode: holding.unofficial_currency_code,
})

const mapPlaidSecurityType = (type: string | null): SecurityTypeEnum => {
    const typeEnum = type as PlaidSecurityTypeEnum
    if (Object.values(PlaidSecurityTypeEnum).includes(typeEnum)) {
        return securityTypeMap[type as PlaidSecurityTypeEnum]
    }
    return SecurityTypeEnum.Other
}
