import { Request, Response } from 'express'
import { env } from 'process'
import { ClientSecrets } from '../models/clientSecrets.js'
import { logger } from '../utils/logger.js'

export const getSecrets = async (_req: Request, res: Response) => {
    logger.debug('getting secrets')

    const logtailToken = env['CLIENT_LOGTAIL_TOKEN']
    if (!logtailToken) throw Error('missing one or more secrets')

    const secrets: ClientSecrets = {
        logtailToken,
    }
    return res.send(secrets)
}
