import express from 'express'
import accountRouter from './accountRoutes.js'
import authRouter from './authRoutes.js'
import categoryRouter from './categoryRoutes.js'
import secretsRouter from './secretsRoutes.js'
import transactionRouter from './transactionRoutes.js'
import userRouter from './userRoutes.js'

const router = express.Router()
router.use('/auth', authRouter)
router.use('/secrets', secretsRouter)
router.use('/accounts', accountRouter)
router.use('/categories', categoryRouter)
router.use('/transactions', transactionRouter)
router.use('/users', userRouter)
export default router
