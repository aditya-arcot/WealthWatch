import express from 'express'
import { getAccounts } from '../controllers/accountController.js'

const accountsRouter = express.Router()

accountsRouter.route('/').get(getAccounts)

export default accountsRouter
