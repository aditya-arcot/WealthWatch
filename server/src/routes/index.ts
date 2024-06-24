import express from 'express'
import accountsRouter from './accountRoutes.js'
import categoriesRouter from './categoryRoutes.js'
import secretsRouter from './secretsRoutes.js'
import transactionsRouter from './transactionRoutes.js'
import usersRouter from './userRoutes.js'

const routes = [
    {
        path: '/secrets',
        router: secretsRouter,
    },
    {
        path: '/accounts',
        router: accountsRouter,
    },
    {
        path: '/categories',
        router: categoriesRouter,
    },
    {
        path: '/transactions',
        router: transactionsRouter,
    },
    {
        path: '/users',
        router: usersRouter,
    },
]

const router = express.Router()
routes.forEach((route) => {
    router.use(route.path, route.router)
})
export default router
