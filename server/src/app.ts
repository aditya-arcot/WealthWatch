import cookieParser from 'cookie-parser'
import express from 'express'
import helmet from 'helmet'
import methodOverride from 'method-override'
import swaggerUi from 'swagger-ui-express'
import { processWebhook } from './controllers/webhookController.js'
import router from './routes/index.js'
import { catchAsync } from './utils/catchAsync.js'
import { production } from './utils/env.js'
import { logger } from './utils/logger.js'
import {
    corsMiddleware,
    createCsrfMiddleware,
    createSessionMiddleware,
    handleError,
    handleUnmatchedRoute,
    logRequestResponse,
} from './utils/middleware.js'
import { createSwaggerSpec, swaggerOptions } from './utils/swagger.js'

export const startExpressApps = () => {
    logger.debug('starting express apps')
    startMainApp()
    startWebhookApp()
}

const startMainApp = () => {
    logger.debug('configuring main app')
    const app = express()
    if (production) {
        app.set('trust proxy', 1)
    }

    logger.debug('configuring middleware')
    app.use(
        helmet({
            contentSecurityPolicy: {
                reportOnly: !production,
            },
        })
    )
    app.use(corsMiddleware)
    app.use(express.json())
    app.use(express.urlencoded({ extended: true }))
    app.use(createSessionMiddleware())
    app.use(logRequestResponse)
    app.use(methodOverride('_method'))
    app.use(cookieParser())
    app.use(createCsrfMiddleware())

    logger.debug('configuring routes')
    app.use('/status', (_req, res) => res.send('ok'))
    app.get('/csrf-token', (req, res) => {
        const token = req.csrfToken!()
        res.send({ csrfToken: token })
    })
    if (!production) {
        app.use(
            '/swagger',
            swaggerUi.serve,
            swaggerUi.setup(createSwaggerSpec(), swaggerOptions)
        )
    }
    app.use('/', router)
    app.use(handleUnmatchedRoute)
    app.use(handleError)

    logger.debug('starting main app')
    const port = 3000
    app.listen(port, () => {
        logger.info(`main app running on port ${port}`)
    })
}

const startWebhookApp = () => {
    logger.debug('configuring webhook app')
    const webhookApp = express()

    logger.debug('configuring middleware')
    webhookApp.use(express.json())
    webhookApp.use(express.urlencoded({ extended: true }))
    webhookApp.use(logRequestResponse)

    logger.debug('configuring routes')
    webhookApp.use('/status', (_req, res) => res.send('ok'))
    webhookApp.post('/webhooks', catchAsync(processWebhook))
    webhookApp.use(handleUnmatchedRoute)
    webhookApp.use(handleError)

    logger.debug('starting webhook app')
    const webhookPort = 3001
    webhookApp.listen(webhookPort, () => {
        logger.info(`webhook app running on port ${webhookPort}`)
    })
}
