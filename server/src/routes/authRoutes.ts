import express from 'express'
import { login, register } from '../controllers/authController.js'
import { catchAsync } from '../utils/catchAsync.js'

const router = express.Router()

router.route('/login').post(catchAsync(login))
router.route('/register').post(catchAsync(register))

export default router
