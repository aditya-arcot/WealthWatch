import express from 'express'
import {
    exchangePublicToken,
    getLinkToken,
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
 * /plaid/link-token:
 *   get:
 *     summary: Get link token
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
router.route('/link-token').get(authenticate, catchAsync(getLinkToken))

/**
 * @swagger
 * /plaid/public-token:
 *   post:
 *     summary: Exchange public token for access token
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
router
    .route('/public-token')
    .post(authenticate, catchAsync(exchangePublicToken))

export default router
