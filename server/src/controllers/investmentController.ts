import { Request, Response } from 'express'
import { insertAccounts } from '../database/accountQueries.js'
import {
    fetchActiveHoldingsWithUserId,
    insertHoldings,
} from '../database/holdingQueries.js'
import { fetchActiveItemsWithUserId } from '../database/itemQueries.js'
import {
    fetchSecurities,
    insertSecurities,
} from '../database/securityQueries.js'
import { HttpError } from '../models/error.js'
import { Item } from '../models/item.js'
import { plaidAccountsGet } from '../plaid/accountMethods.js'
import {
    mapPlaidHolding,
    mapPlaidSecurity,
    plaidInvestmentsHoldingsGet,
} from '../plaid/investmentMethods.js'
import { logger } from '../utils/logger.js'

export const syncUserInvestments = async (req: Request, res: Response) => {
    logger.debug('syncing user investments')

    const userId = req.session.user?.id
    if (userId === undefined) throw new HttpError('missing user id', 400)

    const items = await fetchActiveItemsWithUserId(userId)
    await Promise.all(items.map(async (item) => await syncInvestments(item)))

    return res.status(204).send()
}

export const syncInvestments = async (item: Item) => {
    logger.debug({ id: item.id }, 'syncing item investments')

    const accounts = await plaidAccountsGet(item)
    if (accounts.length > 0) {
        logger.debug('inserting accounts')
        const addedAccounts = await insertAccounts(accounts)
        if (!addedAccounts) throw new HttpError('failed to insert accounts')

        const { holdings, securities } = await plaidInvestmentsHoldingsGet(item)

        if (securities.length > 0) {
            logger.debug('inserting investment securities')
            const addSecurities = securities.map(mapPlaidSecurity)
            const addedSecurities = await insertSecurities(addSecurities)
            if (!addedSecurities)
                throw new HttpError('failed to insert securities')
        }

        if (holdings.length > 0) {
            logger.debug('inserting investment holdings')
            const existingSecurities = await fetchSecurities()
            const addHoldings = holdings.map((holding) => {
                const account = addedAccounts.find(
                    (a) => a.plaidId === holding.account_id
                )
                if (!account) throw new HttpError('account not found', 404)

                const security = existingSecurities.find(
                    (s) => s.plaidId === holding.security_id
                )
                if (!security) throw new HttpError('security not found', 404)

                return mapPlaidHolding(holding, account.id, security.id)
            })
            const addedHoldings = await insertHoldings(addHoldings)
            if (!addedHoldings) throw new HttpError('failed to insert holdings')
        }
    } else {
        logger.debug('no accounts. skipping investment updates')
    }
}

export const getUserHoldings = async (req: Request, res: Response) => {
    logger.debug('getting holdings')

    const userId = req.session.user?.id
    if (userId === undefined) throw new HttpError('missing user id', 400)

    const holdings = await fetchActiveHoldingsWithUserId(userId)
    return res.send(holdings)
}
