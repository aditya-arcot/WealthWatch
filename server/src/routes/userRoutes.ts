import express from 'express'
import {
    checkEmailExists,
    checkUsernameExists,
    getCurrentUser,
    getUsers,
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
 *     summary: Get current user
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: The current user (undefined if not logged in)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 */
router.route('/current').get(getCurrentUser)

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Retrieve a list of users
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: A list of users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.route('/').get(authenticate, catchAsync(getUsers))

/**
 * @swagger
 * /users/username-in-use/{username}:
 *   get:
 *     summary: Check if username is in use
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: username
 *         schema:
 *           type: string
 *         required: true
 *         description: The username to check
 *     responses:
 *       200:
 *         description: Whether the username is in use
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
 *     summary: Check if email is in use
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: email
 *         schema:
 *           type: string
 *         required: true
 *         description: The email to check
 *     responses:
 *       200:
 *         description: Whether the email is in use
 *         content:
 *           application/json:
 *             schema:
 *               type: boolean
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.route('/email-in-use/:email').get(catchAsync(checkEmailExists))

export default router
