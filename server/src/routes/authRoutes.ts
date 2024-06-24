import express from 'express'
import { login, register } from '../controllers/authController.js'
import { catchAsync } from '../utils/catchAsync.js'

const router = express.Router()

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Auth management
 */

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login using existing account
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
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: The logged in user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 */
router.route('/login').post(catchAsync(login))

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
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               first_name:
 *                 type: string
 *               last_name:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: The egistered user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 */
router.route('/register').post(catchAsync(register))

export default router
