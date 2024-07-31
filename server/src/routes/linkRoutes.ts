import express from 'express'
import {
    createLinkToken,
    exchangePublicToken,
    handleLinkEvent,
} from '../controllers/linkController.js'
import { catchAsync } from '../utils/catchAsync.js'
import { authenticate } from '../utils/middleware.js'

const router = express.Router()

/**
 * @swagger
 * tags:
 *   name: Link
 *   description: Link management
 */

/**
 * @swagger
 * /link/link-token:
 *   get:
 *     summary: Create a link token
 *     tags: [Link]
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
 * /link/link-event:
 *   post:
 *     summary: Handle a link event
 *     tags: [Link]
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
 * /link/public-token:
 *   post:
 *     summary: Exchange a public token
 *     tags: [Link]
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
