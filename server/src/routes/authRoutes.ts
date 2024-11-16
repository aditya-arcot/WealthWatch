import express from 'express'
import {
    login,
    logout,
    register,
    requestAccess,
    validateAccessCode,
} from '../controllers/authController.js'
import { catchAsync } from '../utils/catchAsync.js'
import { authenticate } from '../utils/middleware.js'

const router = express.Router()

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Auth management
 */

/**
 * @swagger
 * /auth/access-request:
 *   post:
 *     summary: Request access to the app
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *                 required: true
 *               lastName:
 *                 type: string
 *                 required: true
 *               email:
 *                 type: string
 *                 required: true
 *     responses:
 *       204:
 *         description: Requested access
 */
router.route('/access-request').post(catchAsync(requestAccess))

/**
 * @swagger
 * /auth/access-code:
 *   post:
 *     summary: Validate access code
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               accessCode:
 *                 type: string
 *                 required: true
 *     responses:
 *       200:
 *         description: Validated access code
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 name:
 *                   type: string
 *                 email:
 *                   type: string
 */
router.route('/access-code').post(catchAsync(validateAccessCode))

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register for a new account
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               accessCode:
 *                 type: string
 *                 required: true
 *               username:
 *                 type: string
 *                 required: true
 *               password:
 *                 type: string
 *                 required: true
 *     responses:
 *       201:
 *         description: Registered the user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 */
router.route('/register').post(catchAsync(register))

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Log in using an existing account
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 required: true
 *               password:
 *                 type: string
 *                 required: true
 *     responses:
 *       200:
 *         description: Logged in the user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 */
router.route('/login').post(catchAsync(login))

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Log out
 *     tags: [Auth]
 *     responses:
 *       204:
 *         description: Logged out the current user
 *       401:
 *          $ref: '#/components/responses/Unauthorized'
 */
router.route('/logout').post(authenticate, logout)

export default router
