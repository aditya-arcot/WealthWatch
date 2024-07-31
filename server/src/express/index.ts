import { logger } from '../utils/logger.js'
import { startMainApp } from './mainApp.js'
import { startWebhookApp } from './webhookApp.js'

export const startApps = () => {
    logger.debug('starting apps')
    startMainApp()
    startWebhookApp()
}
