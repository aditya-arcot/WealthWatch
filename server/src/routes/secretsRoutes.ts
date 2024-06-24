import express from 'express'
import { getSecrets } from '../controllers/secretsController.js'
import { catchAsync } from '../utils/catchAsync.js'

const secretsRouter = express.Router()

secretsRouter.route('/').get(catchAsync(getSecrets))

export default secretsRouter
