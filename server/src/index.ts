import express from 'express'
import helmet from 'helmet'
import methodOverride from 'method-override'
import { pid } from 'process'
import { ExpressError } from './models/expressError.js'
import router from './routes/index.js'
import { configureCleanup } from './utils/cleanup.js'
import { createPool } from './utils/database.js'
import { logger } from './utils/logger.js'
import {
    configureSession,
    handleCors,
    handleError,
    logRequestResponse,
} from './utils/middleware.js'

logger.info(`started - pid ${pid}`)

await createPool()
configureCleanup()

const port = process.env['PORT'] || 3000
const app = express()
app.use(helmet())
app.use(handleCors)
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(logRequestResponse)
app.use(methodOverride('_method'))
app.use(configureSession())
app.use('/', router)
app.use((req, _res, _next) => {
    throw new ExpressError(`endpoint not found - ${req.url}`, 404)
})
app.use(handleError)
app.listen(port, (): void => {
    logger.info(`server running - port ${port}`)
})
