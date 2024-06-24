import express from 'express'
import { getTransactions } from '../controllers/transactionController.js'
import { catchAsync } from '../utils/catchAsync.js'

const transactionsRouter = express.Router()

transactionsRouter.route('/').get(catchAsync(getTransactions))

export default transactionsRouter
