import { deleteCurrentUser, getCurrentUser } from '@controllers'
import { authenticate, catchAsync } from '@middleware'
import express from 'express'

const router = express.Router()

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: Users management
 */

/**
 * @swagger
 * /users/current:
 *   get:
 *     summary: Retrieve the logged-in user
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Retrieved the logged-in user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *   delete:
 *     summary: Delete the logged-in user
 *     tags: [Users]
 *     responses:
 *       204:
 *         description: Deleted the logged-in user
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router
    .route('/current')
    .get(getCurrentUser)
    .delete(authenticate, catchAsync(deleteCurrentUser))

export default router
