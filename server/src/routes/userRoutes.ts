import express from 'express'
import {
    checkUserExists,
    deleteCurrentUser,
    getCurrentUser,
} from '../controllers/userController.js'
import { catchAsync } from '../utils/catchAsync.js'
import { authenticate } from '../utils/middleware.js'

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
 *     summary: Retrieve the logged in user
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Retrieved the logged in user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *   delete:
 *     summary: Delete the logged in user
 *     tags: [Users]
 *     responses:
 *       204:
 *         description: Deleted the logged in user
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router
    .route('/current')
    .get(getCurrentUser)
    .delete(authenticate, catchAsync(deleteCurrentUser))

/**
 * @swagger
 * /users/exists:
 *   post:
 *     summary: Check if a email or username is in use
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 required: true
 *               username:
 *                 type: string
 *                 required: true
 *     responses:
 *       200:
 *         description: Checked if the email or username is in use
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 emailExists:
 *                   type: boolean
 *                 usernameExists:
 *                   type: boolean
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.route('/exists').post(catchAsync(checkUserExists))

export default router
