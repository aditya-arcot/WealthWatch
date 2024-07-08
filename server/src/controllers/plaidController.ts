import { Request, Response } from 'express'
import {
    Configuration,
    LinkSessionSuccessMetadata,
    PlaidApi,
    PlaidEnvironments,
} from 'plaid'
import { env } from 'process'
import { Account, createAccounts } from '../models/account.js'
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
    try {
        if (!req.session.user) {
            throw new HttpError('unauthorized', 401)
        }
        const token = await createLinkTokenByUser(req.session.user.id, client)
        return res.send(token)
    } catch (error) {
        logger.error(error)
        throw new HttpError('failed to create link token')
    }
}

export const getAccessToken = async (req: Request, res: Response) => {
    logger.debug('getting access token')
    try {
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

        const token = await exchangePublicToken(publicToken, client)
        const newItem: PlaidItem = {
            id: token.itemId,
            accessToken: token.accessToken,
            institutionId: metadata.institution?.institution_id ?? '',
            institutionName: metadata.institution?.name ?? '',
            userId: req.session.user?.id,
        }
        await createItem(newItem)

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
        await createAccounts(newAccounts)

        return res.send(token)
    } catch (error) {
        logger.error(error)
        throw new HttpError('failed to get access token')
    }
}
