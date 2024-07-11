import express from 'express'
import accountRouter from './accountRoutes.js'
import authRouter from './authRoutes.js'
import plaidRouter from './plaidRoutes.js'
import secretsRouter from './secretsRoutes.js'
import userRouter from './userRoutes.js'

const router = express.Router()
router.use('/auth', authRouter)
router.use('/secrets', secretsRouter)
router.use('/accounts', accountRouter)
router.use('/users', userRouter)
router.use('/plaid', plaidRouter)
export default router
