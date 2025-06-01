import cookieParser from 'cookie-parser'
import express from 'express'
import helmet from 'helmet'
import methodOverride from 'method-override'
import swaggerUi from 'swagger-ui-express'
import { processWebhook } from './controllers/webhookController.js'
import { HttpError } from './models/error.js'
import router from './routes/index.js'
import { prod } from './utilities/env.js'
import { logger } from './utilities/logger.js'
import {
    catchAsync,
    cors,
    createCsrf,
    createSession,
    handleError,
    handleUnmatchedRoute,
    logRequestResponse,
} from './utilities/middleware.js'
import { createSwaggerSpec, swaggerUiOptions } from './utilities/swagger.js'

export const startExpressApps = () => {
    logger.debug('starting express apps')
    startMainApp()
    startWebhookApp()
}

const startMainApp = () => {
    logger.debug('configuring main app')
    const app = express()
    if (prod) {
        app.set('trust proxy', 1)
    }

    logger.debug('configuring middleware')
    app.use(
        helmet({
            contentSecurityPolicy: {
                reportOnly: !prod,
            },
        })
    )
    app.use(cors)
    app.use(express.json())
    app.use(express.urlencoded({ extended: true }))
    app.use(createSession())
    app.use(logRequestResponse)
    app.use(methodOverride('_method'))
    app.use(cookieParser())
    app.use(createCsrf())

    logger.debug('configuring routes')
    app.use('/status', (_req, res) => {
        res.sendStatus(204)
    })
    app.get('/csrf-token', (req, res) => {
        if (typeof req.csrfToken !== 'function') {
            throw new HttpError('csrfToken method is not defined')
        }
        res.json({ csrfToken: req.csrfToken() })
    })
    if (!prod) {
        app.use(
            '/swagger',
            swaggerUi.serve,
            swaggerUi.setup(createSwaggerSpec(), swaggerUiOptions)
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
    const app = express()

    logger.debug('configuring middleware')
    app.use(
        helmet({
            contentSecurityPolicy: {
                reportOnly: !prod,
            },
        })
    )
    app.use(express.json())
    app.use(express.urlencoded({ extended: true }))
    app.use(logRequestResponse)

    logger.debug('configuring routes')
    app.use('/status', (_req, res) => {
        res.sendStatus(204)
    })
    app.post('/webhooks', catchAsync(processWebhook))
    app.use(handleUnmatchedRoute)
    app.use(handleError)

    logger.debug('starting webhook app')
    const webhookPort = 3001
    app.listen(webhookPort, () => {
        logger.info(`webhook app running on port ${webhookPort}`)
    })
}
