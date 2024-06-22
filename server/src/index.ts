import { randomUUID } from 'crypto'
import express, { NextFunction, Request, Response } from 'express'
import methodOverride from 'method-override'
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
app.use(express.urlencoded({ extended: true }))
app.use((req, res, next) => {
    const id = randomUUID()
    const requestLog = {
        id,
        method: req.method,
        url: req.url,
        query: req.query,
        params: req.params,
        headers: req.headers,
        body: req.body,
        remoteAddress: req.socket.remoteAddress,
        remotePort: req.socket.remotePort,
    }
    logger.info({ requestLog }, 'received request')

    const send = res.send
    res.send = (body) => {
        // @ts-expect-error: custom property
        res._body = body
        res.send = send
        return res.send(body)
    }
    res.on('finish', () => {
        const responseLog = {
            id,
            statusCode: res.statusCode,
            headers: res.getHeaders(),
            // @ts-expect-error: custom property
            body: res._body,
        }
        logger.info({ responseLog }, 'sending response')
    })
    next()
})
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
