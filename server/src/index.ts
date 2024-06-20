import express, { NextFunction, Request, Response } from 'express'
import methodOverride from 'method-override'
import { pinoHttp } from 'pino-http'
import { pid } from 'process'
import { ExpressError } from './models/expressError.js'
import { configureCleanup } from './utils/cleanup.js'
import { openDb } from './utils/database.js'
import { logger } from './utils/logger.js'

logger.info(`start ${pid}`)

openDb()
configureCleanup()

const app = express()

// middleware
app.use(pinoHttp({ logger }))
app.use(express.urlencoded({ extended: true }))
app.use(methodOverride('_method'))
app.use(
    (
        err: Error,
        _req: Request,
        res: Response,
        _next: NextFunction
    ): Response => {
        if (err instanceof ExpressError) {
            return res.status(err.statusCode).send(err)
        } else {
            return res.status(500).send(err)
        }
    }
)

// routes
app.get('/', (_, res: Response): Response => {
    return res.send('alive')
})
app.all('*', (_req, _res, _next) => {
    throw new ExpressError('endpoint not found', 404)
})

const port = process.env['PORT'] || 3000
app.listen(port, (): void => {
    logger.info(`server running on port ${port}`)
})
