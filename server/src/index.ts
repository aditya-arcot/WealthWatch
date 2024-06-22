import express, { NextFunction, Request, Response } from 'express'
import methodOverride from 'method-override'
import { pinoHttp } from 'pino-http'
import { pid } from 'process'
import { ExpressError } from './models/expressError.js'
import accountsRouter from './routes/accountRoutes.js'
import categoriesRouter from './routes/categoryRoutes.js'
import transactionsRouter from './routes/transactionRoutes.js'
import usersRouter from './routes/userRoutes.js'
import { configureCleanup } from './utils/cleanup.js'
import { createPool } from './utils/database.js'
import { logger } from './utils/logger.js'

logger.info(`started - pid ${pid}`)

await createPool()
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
app.use('/accounts', accountsRouter)
app.use('/categories', categoriesRouter)
app.use('/transactions', transactionsRouter)
app.use('/users', usersRouter)
app.all('*', (req, _res, _next) => {
    throw new ExpressError(`endpoint not found - ${req.url}`, 404)
})

const port = process.env['PORT'] || 3000
app.listen(port, (): void => {
    logger.info(`server running - port ${port}`)
})
