import express from 'express'
import { getUsers } from '../controllers/userController.js'
import { catchAsync } from '../utils/catchAsync.js'

const usersRouter = express.Router()

usersRouter.route('/').get(catchAsync(getUsers))

export default usersRouter
