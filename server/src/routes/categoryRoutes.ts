import express from 'express'
import { getCategories } from '../controllers/categoryController.js'
import { catchAsync } from '../utils/catchAsync.js'

const categoriesRouter = express.Router()

categoriesRouter.route('/').get(catchAsync(getCategories))

export default categoriesRouter
