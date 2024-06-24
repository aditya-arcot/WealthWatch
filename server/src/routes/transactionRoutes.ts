import express from 'express'
import { getTransactions } from '../controllers/transactionController.js'
import { catchAsync } from '../utils/catchAsync.js'
import { authenticate } from '../utils/middleware.js'

const router = express.Router()

router.route('/').get(authenticate, catchAsync(getTransactions))

export default router
