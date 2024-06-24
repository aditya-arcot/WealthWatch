import express from 'express'
import { getAccounts } from '../controllers/accountController.js'
import { catchAsync } from '../utils/catchAsync.js'
import { authenticate } from '../utils/middleware.js'

const router = express.Router()

/**
 * @swagger
 * tags:
 *   name: Accounts
 *   description: Accounts management
 */

/**
 * @swagger
 * /accounts:
 *   get:
 *     summary: Retrieve a list of accounts
 *     tags: [Accounts]
 *     responses:
 *       200:
 *         description: A list of accounts
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Account'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.route('/').get(authenticate, catchAsync(getAccounts))

export default router
