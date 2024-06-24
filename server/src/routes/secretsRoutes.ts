import express from 'express'
import { getSecrets } from '../controllers/secretsController.js'
import { catchAsync } from '../utils/catchAsync.js'
import { authenticate } from '../utils/middleware.js'

const router = express.Router()

router.route('/').get(authenticate, catchAsync(getSecrets))

export default router
