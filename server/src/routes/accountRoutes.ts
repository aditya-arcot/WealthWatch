import express from 'express'
import { getUserAccounts } from '../controllers/accountController.js'
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
 *     summary: Retrieve the logged in user's accounts
 *     tags: [Accounts]
 *     responses:
 *       200:
 *         description: Retrieved the logged in user's accounts
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Account'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.route('/').get(authenticate, catchAsync(getUserAccounts))

export default router
