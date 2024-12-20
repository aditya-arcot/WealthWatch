import { Request, Response } from 'express'
import { Secrets } from '../models/secrets.js'
import { vars } from '../utils/env.js'
import { logger } from '../utils/logger.js'

export const getSecrets = async (_req: Request, res: Response) => {
    logger.debug('getting secrets')
    const secrets: Secrets = {
        logtailToken: vars.clientLogtailToken,
    }
    return res.json(secrets)
}
