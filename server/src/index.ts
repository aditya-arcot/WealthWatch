import cookieParser from 'cookie-parser'
import express from 'express'
import helmet from 'helmet'
import methodOverride from 'method-override'
import { pid } from 'process'
import swaggerUi from 'swagger-ui-express'
import { handleWebhook } from './controllers/plaidController.js'
import router from './routes/index.js'
import { catchAsync } from './utils/catchAsync.js'
import { configureCleanup } from './utils/cleanup.js'
import { createPool, createRedis } from './utils/database.js'
import { logger } from './utils/logger.js'
import { initializeLogQueue, initializeLogWorker } from './utils/logQueue.js'
import {
    corsMiddleware,
    createCsrfMiddleware,
    createSessionMiddleware,
    handleError,
    handleUnmatchedRoute,
    logRequestResponse,
    production,
} from './utils/middleware.js'
import { createSwaggerSpec, swaggerOptions } from './utils/swagger.js'

logger.info(`started - pid ${pid}`)

createRedis()
await createPool()
configureCleanup()
initializeLogQueue()
initializeLogWorker()

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
    logger.info(`main server running - port ${port}`)
})

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
    logger.info(`webhook server running - port ${webhookPort}`)
})
