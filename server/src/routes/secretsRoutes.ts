import express from 'express'
import { getSecrets } from '../controllers/secretsController.js'

const secretsRouter = express.Router()

secretsRouter.route('/').get(getSecrets)

export default secretsRouter
