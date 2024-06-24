import express from 'express'
import { getCategories } from '../controllers/categoryController.js'
import { catchAsync } from '../utils/catchAsync.js'

const router = express.Router()

router.route('/').get(catchAsync(getCategories))

export default router
