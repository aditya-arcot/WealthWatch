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
 *   post:
 *     summary: Create a link token
 *     tags: [Link]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               itemId:
 *                 type: integer
 *               updateAccounts:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Created a link token
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               event:
 *                 type: object
 *                 required: true
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               publicToken:
 *                 type: string
 *                 required: true
 *               metadata:
 *                 type: object
 *                 required: true
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
