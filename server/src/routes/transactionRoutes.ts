import express from 'express'
import { getTransactions } from '../controllers/transactionController.js'
import { catchAsync } from '../utils/catchAsync.js'

const router = express.Router()

router.route('/').get(catchAsync(getTransactions))

export default router
