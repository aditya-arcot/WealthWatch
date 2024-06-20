import express from 'express'
import { getUsers } from '../controllers/userController.js'

const usersRouter = express.Router()

usersRouter.route('/').get(getUsers)

export default usersRouter
