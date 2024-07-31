import express from 'express'
import { getUserItems } from '../controllers/itemController.js'
import { catchAsync } from '../utils/catchAsync.js'
import { authenticate } from '../utils/middleware.js'

const router = express.Router()

/**
 * @swagger
 * tags:
 *   name: Items
 *   description: Items management
 */

/**
 * @swagger
 * /items:
 *   get:
 *     summary: Retrieve the logged in user's items
 *     tags: [Items]
 *     responses:
 *       200:
 *         description: Retrieved the logged in user's items
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Item'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.route('/').get(authenticate, catchAsync(getUserItems))

export default router
