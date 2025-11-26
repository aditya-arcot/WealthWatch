import { logger, vars } from '@utilities'
import { Secrets } from '@wealthwatch-shared'
import { Request, Response } from 'express'

export const getSecrets = async (_req: Request, res: Response) => {
    logger.debug('getting secrets')
    const secrets: Secrets = {
        logtailToken: vars.clientLogtailToken,
        demoUser: vars.demoUser,
    }
    res.json(secrets)
}
