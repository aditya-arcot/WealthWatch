import express from 'express'
import { getItemsByUser } from '../controllers/itemController.js'
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
 *     summary: Retrieve a user's items
 *     tags: [Items]
 *     responses:
 *       200:
 *         description: A list of user's items
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Item'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.route('/').get(authenticate, catchAsync(getItemsByUser))

export default router
