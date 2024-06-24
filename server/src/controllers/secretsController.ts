import { Request, Response } from 'express'
import { env } from 'process'
import { ClientSecrets } from '../models/clientSecrets.js'
import { HttpError } from '../models/httpError.js'
import { logger } from '../utils/logger.js'

export const getSecrets = async (_req: Request, res: Response) => {
    logger.info('getting secrets')
    if (!env['CLIENT_LOGTAIL_TOKEN']) {
        throw new HttpError('missing one or more secrets', 500)
    }
    const secrets: ClientSecrets = {
        logtailToken: env['CLIENT_LOGTAIL_TOKEN'],
    }
    return res.send(secrets)
}
