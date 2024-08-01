import cookieParser from 'cookie-parser'
import express from 'express'
import helmet from 'helmet'
import methodOverride from 'method-override'
import swaggerUi from 'swagger-ui-express'
import router from '../routes/index.js'
import { logger } from '../utils/logger.js'
import {
    corsMiddleware,
    createCsrfMiddleware,
    createSessionMiddleware,
    handleError,
    handleUnmatchedRoute,
    logRequestResponse,
    production,
} from '../utils/middleware.js'
import { createSwaggerSpec, swaggerOptions } from '../utils/swagger.js'

export const startMainApp = () => {
    logger.debug('configuring main app')
    const app = express()
    if (production) {
        app.set('trust proxy', 1)
    }

    logger.debug('configuring middleware')
    app.use(helmet())
    app.use(corsMiddleware)
    app.use(methodOverride('_method'))
    app.use(express.json())
    app.use(express.urlencoded({ extended: true }))
    app.use(createSessionMiddleware())
    app.use(cookieParser())
    app.use(logRequestResponse) // keep before csrf
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
