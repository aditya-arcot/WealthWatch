import express from 'express'
import {
    createLinkToken,
    getAccessToken,
} from '../controllers/plaidController.js'
import { catchAsync } from '../utils/catchAsync.js'
import { authenticate } from '../utils/middleware.js'

const router = express.Router()

/**
 * @swagger
 * tags:
 *   name: Plaid
 *   description: Plaid management
 */

/**
 * @swagger
 * /plaid/create-link-token:
 *   post:
 *     summary: Create link token
 *     tags: [Plaid]
 *     responses:
 *       200:
 *         description: The link token object
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LinkToken'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router
    .route('/create-link-token')
    .post(authenticate, catchAsync(createLinkToken))

/**
 * @swagger
 * /plaid/get-access-token:
 *   post:
 *     summary: Get access token
 *     tags: [Plaid]
 *     parameters:
 *       - in: body
 *         name: publicToken
 *         schema:
 *           type: string
 *         required: true
 *         description: The public token
 *       - in: body
 *         name: metadata
 *         schema:
 *           type: object
 *         required: true
 *         description: The metadata
 *     responses:
 *       200:
 *         description: The access token object
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AccessToken'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.route('/get-access-token').post(authenticate, catchAsync(getAccessToken))

export default router
