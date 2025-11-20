import {
    login,
    loginWithDemo,
    logout,
    register,
    requestAccess,
    validateAccessCode,
} from '@controllers'
import { authenticate, catchAsync } from '@utilities'
import express from 'express'

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
 *             $ref: '#/components/schemas/FirstNameLastNameEmail'
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
 *             $ref: '#/components/schemas/AccessCode'
 *     responses:
 *       200:
 *         description: Validated access code
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NameEmail'
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
 *             $ref: '#/components/schemas/AccessCodeUserNamePassword'
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
 *             $ref: '#/components/schemas/UsernamePassword'
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
 * /auth/login/demo:
 *   post:
 *     summary: Log in using the demo account
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Logged in the demo user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 */
router.route('/login/demo').post(catchAsync(loginWithDemo))

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
