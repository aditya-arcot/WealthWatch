import { Secrets } from '@wealthwatch-shared'
import { Request, Response } from 'express'
import { vars } from '../utilities/env.js'
import { logger } from '../utilities/logger.js'

export const getSecrets = async (_req: Request, res: Response) => {
    logger.debug('getting secrets')
    const secrets: Secrets = {
        logtailToken: vars.clientLogtailToken,
        demoUser: vars.demoUser,
    }
    return res.json(secrets)
}
