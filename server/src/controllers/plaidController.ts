import { Request, Response } from 'express'
import {
    Configuration,
    LinkSessionSuccessMetadata,
    PlaidApi,
    PlaidEnvironments,
} from 'plaid'
import { env } from 'process'
import {
    Account,
    createAccounts,
    fetchAccountsWithInstitutionByUser,
} from '../models/account.js'
import { HttpError } from '../models/httpError.js'
import {
    createItem,
    createLinkTokenByUser,
    exchangePublicToken,
    PlaidItem,
} from '../models/plaid.js'
import { logger } from '../utils/logger.js'

if (!env['PLAID_ENV'] || !env['PLAID_CLIENT_ID'] || !env['PLAID_SECRET']) {
    throw Error('missing one or more plaid secrets')
}
const config = new Configuration({
    basePath: PlaidEnvironments[env['PLAID_ENV']]!,
    baseOptions: {
        headers: {
            'PLAID-CLIENT-ID': env['PLAID_CLIENT_ID'],
            'PLAID-SECRET': env['PLAID_SECRET'],
        },
    },
})
const client = new PlaidApi(config)
logger.debug(config, 'configured plaid client')

export const createLinkToken = async (req: Request, res: Response) => {
    logger.debug('creating link token')
    if (!req.session.user) {
        throw new HttpError('unauthorized', 401)
    }

    try {
        const token = await createLinkTokenByUser(req.session.user.id, client)
        return res.send(token)
    } catch (error) {
        logger.error(error)
        throw new HttpError('unexpected error while creating link token')
    }
}

export const getAccessToken = async (req: Request, res: Response) => {
    logger.debug('getting access token')
    if (!req.session.user) {
        throw new HttpError('unauthorized', 401)
    }

    const publicToken: string | undefined = req.body.publicToken
    if (!publicToken) {
        throw new HttpError('missing public token', 400)
    }
    const metadata: LinkSessionSuccessMetadata = req.body.metadata
    if (!metadata) {
        throw new HttpError('missing metadata', 400)
    }

    // check for duplicate account using institution id, account name, account mask
    const accounts = await fetchAccountsWithInstitutionByUser(
        req.session.user.id
    )
    if (
        accounts.some((acc) => {
            return (
                acc.institutionId === metadata.institution?.institution_id &&
                metadata.accounts?.some((newAcc) => {
                    return acc.name === newAcc.name && acc.mask === newAcc.mask
                })
            )
        })
    )
        throw new HttpError('account already exists', 409)

    try {
        const token = await exchangePublicToken(publicToken, client)
        const newItem: PlaidItem = {
            id: token.itemId,
            accessToken: token.accessToken,
            institutionId: metadata.institution?.institution_id ?? '',
            institutionName: metadata.institution?.name ?? '',
            userId: req.session.user?.id,
        }

        const newAccounts: Account[] = []
        metadata.accounts?.forEach((acc) => {
            newAccounts.push({
                id: acc.id!,
                name: acc.name!,
                itemId: newItem.id,
                mask: acc.mask ?? null,
                type: acc.type!,
                subtype: acc.subtype!,
            })
        })

        await createItem(newItem)
        await createAccounts(newAccounts)
        return res.send(token)
    } catch (error) {
        logger.error(error)
        throw new HttpError('unexpected error while getting access token')
    }
}
