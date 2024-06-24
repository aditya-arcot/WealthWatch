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
    createCorsMiddleware,
    createSessionMiddleware,
    handleError,
    logRequestResponse,
} from './utils/middleware.js'
import { createSwaggerSpec } from './utils/swagger.js'

logger.info(`started - pid ${pid}`)

await createPool()
configureCleanup()

const port = parseInt(process.env['PORT'] || '3000')
const app = express()
app.use(helmet())
app.use(createCorsMiddleware)
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(methodOverride('_method'))
app.use(createSessionMiddleware())
app.use(logRequestResponse)
if (process.env['NODE_ENV'] !== 'production') {
    app.use(
        '/swagger',
        swaggerUi.serve,
        swaggerUi.setup(createSwaggerSpec(port))
    )
}
app.use('/', router)
app.use((req, _res, _next) => {
    throw new HttpError(`endpoint not found - ${req.url}`, 404)
})
app.use(handleError)
app.listen(port, (): void => {
    logger.info(`server running - port ${port}`)
})
