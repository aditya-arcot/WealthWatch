import express from 'express'
import { handleWebhook } from '../controllers/webhookController.js'
import { catchAsync } from '../utils/catchAsync.js'
import { logger } from '../utils/logger.js'
import {
    handleError,
    handleUnmatchedRoute,
    logRequestResponse,
} from '../utils/middleware.js'

export const startWebhookApp = () => {
    logger.debug('configuring webhook app')
    const webhookApp = express()

    logger.debug('configuring middleware')
    webhookApp.use(express.json())
    webhookApp.use(express.urlencoded({ extended: true }))
    webhookApp.use(logRequestResponse)

    logger.debug('configuring routes')
    webhookApp.use('/status', (_req, res) => res.send('ok'))
    webhookApp.post('/webhooks', catchAsync(handleWebhook))
    webhookApp.use(handleUnmatchedRoute)
    webhookApp.use(handleError)

    logger.debug('starting webhook app')
    const webhookPort = 3001
    webhookApp.listen(webhookPort, () => {
        logger.info(`webhook app running on port ${webhookPort}`)
    })
}
