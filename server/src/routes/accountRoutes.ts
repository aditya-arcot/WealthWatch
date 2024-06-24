import express from 'express'
import { getAccounts } from '../controllers/accountController.js'
import { catchAsync } from '../utils/catchAsync.js'

const router = express.Router()

router.route('/').get(catchAsync(getAccounts))

export default router
