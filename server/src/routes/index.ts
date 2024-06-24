import express from 'express'
import accountRouter from './accountRoutes.js'
import authRouter from './authRoutes.js'
import categoryRouter from './categoryRoutes.js'
import secretsRouter from './secretsRoutes.js'
import transactionRouter from './transactionRoutes.js'
import userRouter from './userRoutes.js'

const routes = [
    {
        path: '/auth',
        router: authRouter,
    },
    {
        path: '/secrets',
        router: secretsRouter,
    },
    {
        path: '/accounts',
        router: accountRouter,
    },
    {
        path: '/categories',
        router: categoryRouter,
    },
    {
        path: '/transactions',
        router: transactionRouter,
    },
    {
        path: '/users',
        router: userRouter,
    },
]

const router = express.Router()
routes.forEach((route) => {
    router.use(route.path, route.router)
})
export default router
