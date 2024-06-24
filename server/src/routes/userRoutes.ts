import express from 'express'
import { getUsers } from '../controllers/userController.js'
import { catchAsync } from '../utils/catchAsync.js'

const router = express.Router()

router.route('/').get(catchAsync(getUsers))

export default router
