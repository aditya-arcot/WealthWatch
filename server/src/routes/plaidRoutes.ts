import express from 'express'
import {
    exchangePublicToken,
    getLinkToken,
    handleLinkEvent,
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
 * /plaid/link-event:
 *   post:
 *     summary: Handle link event
 *     tags: [Plaid]
 *     parameters:
 *       - in: body
 *         name: event
 *         schema:
 *           type: object
 *         required: true
 *         description: The link event
 *     responses:
 *       204:
 *         description: The link event was handled
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.route('/link-event').post(authenticate, catchAsync(handleLinkEvent))

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
 *       204:
 *         description: The public token was exchanged
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router
    .route('/public-token')
    .post(authenticate, catchAsync(exchangePublicToken))

export default router
