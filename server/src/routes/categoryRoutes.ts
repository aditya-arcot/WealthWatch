import express from 'express'
import { getCategories } from '../controllers/categoryController.js'
import { catchAsync } from '../utils/catchAsync.js'
import { authenticate } from '../utils/middleware.js'

const router = express.Router()

router.route('/').get(authenticate, catchAsync(getCategories))

export default router
