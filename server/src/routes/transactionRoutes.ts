import express from 'express'
import { getTransactions } from '../controllers/transactionController.js'

const transactionsRouter = express.Router()

transactionsRouter.route('/').get(getTransactions)

export default transactionsRouter
