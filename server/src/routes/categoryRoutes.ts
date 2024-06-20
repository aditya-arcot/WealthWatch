import express from 'express'
import { getCategories } from '../controllers/categoryController.js'

const categoriesRouter = express.Router()

categoriesRouter.route('/').get(getCategories)

export default categoriesRouter
