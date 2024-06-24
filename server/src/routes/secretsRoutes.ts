import express from 'express'
import { getSecrets } from '../controllers/secretsController.js'
import { catchAsync } from '../utils/catchAsync.js'

const router = express.Router()

router.route('/').get(catchAsync(getSecrets))

export default router
