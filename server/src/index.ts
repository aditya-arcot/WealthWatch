import cookieParser from 'cookie-parser'
import express from 'express'
import helmet from 'helmet'
import methodOverride from 'method-override'
import { pid } from 'process'
import swaggerUi from 'swagger-ui-express'
import { HttpError } from './models/httpError.js'
import router from './routes/index.js'
import { configureCleanup } from './utils/cleanup.js'
import { createPool } from './utils/database.js'
import { logger } from './utils/logger.js'
import {
    corsMiddleware,
    createCsrfMiddleware,
    createSessionMiddleware,
    handleError,
    logRequestResponse,
    production,
} from './utils/middleware.js'
import { createSwaggerSpec } from './utils/swagger.js'

logger.info(`started - pid ${pid}`)

await createPool()
configureCleanup()

const app = express()
if (production) {
    app.set('trust proxy', 1)
}

logger.debug('configuring middleware')
app.use(helmet())
app.use(corsMiddleware)
app.use(logRequestResponse)
app.use(methodOverride('_method'))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(createSessionMiddleware())
app.use(cookieParser())
app.use(createCsrfMiddleware())
if (production) {
    logger.debug('configuring swagger')
    app.use('/swagger', swaggerUi.serve, swaggerUi.setup(createSwaggerSpec()))
}

logger.debug('configuring routes')
app.get('/csrf-token', (req, res) => {
    const token = req.csrfToken!()
    res.json({ csrfToken: token })
})
app.use('/', router)
app.use('/status', (_req, res) => res.send('ok'))
app.use((req, _res, _next) => {
    throw new HttpError(`endpoint not found - ${req.url}`, 404)
})
app.use(handleError)

logger.debug('starting server')
const port = 3000
app.listen(port, (): void => {
    logger.info(`server running - port ${port}`)
})
