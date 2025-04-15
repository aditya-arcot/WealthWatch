import cookieParser from 'cookie-parser'
import express from 'express'
import helmet from 'helmet'
import methodOverride from 'method-override'
import swaggerUi from 'swagger-ui-express'
import { processWebhook } from './controllers/webhookController.js'
import { HttpError } from './models/error.js'
import router from './routes/index.js'
import { catchAsync } from './utilities/catchAsync.js'
import { production } from './utilities/env.js'
import { logger } from './utilities/logger.js'
import {
    corsMiddleware,
    createCsrfMiddleware,
    createSessionMiddleware,
    handleError,
    handleUnmatchedRoute,
    logRequestResponse,
} from './utilities/middleware.js'
import { createSwaggerSpec, swaggerOptions } from './utilities/swagger.js'

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
    app.use('/status', (_req, res) => {
        res.sendStatus(204)
    })
    app.get('/csrf-token', (req, res) => {
        if (typeof req.csrfToken !== 'function') {
            throw new HttpError('csrfToken method is not defined')
        }
        res.json({ csrfToken: req.csrfToken() })
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
    const app = express()

    logger.debug('configuring middleware')
    app.use(
        helmet({
            contentSecurityPolicy: {
                reportOnly: !production,
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
