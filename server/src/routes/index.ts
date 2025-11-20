import adminRouter from '@routes/adminRoutes.js'
import authRouter from '@routes/authRoutes.js'
import categoryRouter from '@routes/categoryRoutes.js'
import devRouter from '@routes/devRoutes.js'
import investmentRouter from '@routes/investmentRoutes.js'
import itemRouter from '@routes/itemRoutes.js'
import linkRouter from '@routes/linkRoutes.js'
import notificationRouter from '@routes/notificationRoutes.js'
import secretsRouter from '@routes/secretsRoutes.js'
import spendingRouter from '@routes/spendingRoutes.js'
import transactionRouter from '@routes/transactionRoutes.js'
import userRouter from '@routes/userRoutes.js'
import { prod } from '@utilities/env.js'
import express from 'express'

const router = express.Router()
router.use('/admin', adminRouter)
router.use('/auth', authRouter)
router.use('/categories', categoryRouter)
if (!prod) {
    router.use('/dev', devRouter)
}
router.use('/investments', investmentRouter)
router.use('/items', itemRouter)
router.use('/link', linkRouter)
router.use('/notifications', notificationRouter)
router.use('/secrets', secretsRouter)
router.use('/spending', spendingRouter)
router.use('/transactions', transactionRouter)
router.use('/users', userRouter)

export default router
