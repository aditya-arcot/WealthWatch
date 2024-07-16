import express from 'express'
import { production } from '../utils/middleware.js'
import accountRouter from './accountRoutes.js'
import authRouter from './authRoutes.js'
import devRouter from './devRoutes.js'
import plaidRouter from './plaidRoutes.js'
import secretsRouter from './secretsRoutes.js'
import userRouter from './userRoutes.js'

const router = express.Router()
router.use('/accounts', accountRouter)
router.use('/auth', authRouter)
if (!production) {
    router.use('/dev', devRouter)
}
router.use('/plaid', plaidRouter)
router.use('/secrets', secretsRouter)
router.use('/users', userRouter)

export default router
