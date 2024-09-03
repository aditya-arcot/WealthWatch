import express from 'express'
import { production } from '../utils/env.js'
import accountRouter from './accountRoutes.js'
import authRouter from './authRoutes.js'
import categoryRouter from './categoryRoutes.js'
import devRouter from './devRoutes.js'
import itemRouter from './itemRoutes.js'
import linkRouter from './linkRoutes.js'
import notificationRouter from './notificationRoutes.js'
import secretsRouter from './secretsRoutes.js'
import spendingRouter from './spendingRoutes.js'
import transactionRouter from './transactionRoutes.js'
import userRouter from './userRoutes.js'

const router = express.Router()
router.use('/accounts', accountRouter)
router.use('/auth', authRouter)
router.use('/categories', categoryRouter)
if (!production) {
    router.use('/dev', devRouter)
}
router.use('/items', itemRouter)
router.use('/link', linkRouter)
router.use('/notifications', notificationRouter)
router.use('/secrets', secretsRouter)
router.use('/spending', spendingRouter)
router.use('/transactions', transactionRouter)
router.use('/users', userRouter)

export default router
