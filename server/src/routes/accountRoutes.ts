import express from 'express'
import { getAccounts } from '../controllers/accountController.js'
import { catchAsync } from '../utils/catchAsync.js'
import { authenticate } from '../utils/middleware.js'

const router = express.Router()

router.route('/').get(authenticate, catchAsync(getAccounts))

export default router
