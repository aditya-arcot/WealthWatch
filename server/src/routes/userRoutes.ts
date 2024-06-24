import express from 'express'
import { getUsers } from '../controllers/userController.js'
import { catchAsync } from '../utils/catchAsync.js'
import { authenticate } from '../utils/middleware.js'

const router = express.Router()

router.route('/').get(authenticate, catchAsync(getUsers))

export default router
