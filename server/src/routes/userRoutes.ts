import express from 'express'
import {
    checkEmailExists,
    checkUsernameExists,
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
 * /users/username-in-use/{username}:
 *   get:
 *     summary: Check if a username is in use
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: username
 *         schema:
 *           type: string
 *         required: true
 *         description: The username
 *     responses:
 *       200:
 *         description: Checked if the username is in use
 *         content:
 *           application/json:
 *             schema:
 *               type: boolean
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.route('/username-in-use/:username').get(catchAsync(checkUsernameExists))

/**
 * @swagger
 * /users/email-in-use/{email}:
 *   get:
 *     summary: Check if an email is in use
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: email
 *         schema:
 *           type: string
 *         required: true
 *         description: The email
 *     responses:
 *       200:
 *         description: Checked if the email is in use
 *         content:
 *           application/json:
 *             schema:
 *               type: boolean
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.route('/email-in-use/:email').get(catchAsync(checkEmailExists))

export default router
