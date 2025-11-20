/* eslint-disable no-restricted-imports */
import { prod } from '@utilities'
import express from 'express'
import adminRouter from './admin.js'
import authRouter from './auth.js'
import categoryRouter from './category.js'
import devRouter from './dev.js'
import investmentRouter from './investment.js'
import itemRouter from './item.js'
import linkRouter from './link.js'
import notificationRouter from './notification.js'
import secretsRouter from './secrets.js'
import spendingRouter from './spending.js'
import transactionRouter from './transaction.js'
import userRouter from './user.js'

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
