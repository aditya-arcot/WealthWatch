import express from 'express'
import { getAccounts } from '../controllers/accountController.js'
import { catchAsync } from '../utils/catchAsync.js'

const accountsRouter = express.Router()

accountsRouter.route('/').get(catchAsync(getAccounts))

export default accountsRouter
