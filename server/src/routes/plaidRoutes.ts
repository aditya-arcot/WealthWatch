import express from 'express'
import {
    createLinkToken,
    exchangePublicToken,
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
 *     summary: Create a link token
 *     tags: [Plaid]
 *     responses:
 *       200:
 *         description: Created a link token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LinkToken'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.route('/link-token').post(authenticate, catchAsync(createLinkToken))

/**
 * @swagger
 * /plaid/link-event:
 *   post:
 *     summary: Handle a link event
 *     tags: [Plaid]
 *     parameters:
 *       - in: body
 *         name: event
 *         schema:
 *           type: object
 *         required: true
 *         description: The link event
 *     responses:
 *       202:
 *         description: Handled the link event
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.route('/link-event').post(authenticate, catchAsync(handleLinkEvent))

/**
 * @swagger
 * /plaid/public-token:
 *   post:
 *     summary: Exchange a public token
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
 *         description: Exchanged the public token, queued the item for sync
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router
    .route('/public-token')
    .post(authenticate, catchAsync(exchangePublicToken))

export default router
