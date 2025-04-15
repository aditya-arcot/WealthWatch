import express from 'express'
import {
    createLinkToken,
    exchangePublicToken,
    handleLinkEvent,
    handleLinkUpdateComplete,
} from '../controllers/linkController.js'
import { catchAsync } from '../utilities/catchAsync.js'
import { authenticate } from '../utilities/middleware.js'

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
 *             $ref: '#/components/schemas/ItemIdUpdateAccounts'
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LinkEvent'
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
 *             $ref: '#/components/schemas/PublicTokenMetadata'
 *     responses:
 *       202:
 *         description: Exchanged the public token, queued item syncs
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router
    .route('/public-token')
    .post(authenticate, catchAsync(exchangePublicToken))

/**
 * @swagger
 * /link/link-update:
 *   post:
 *     summary: Handle link update completion
 *     tags: [Link]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ItemIdNotificationTypeId'
 *     responses:
 *       202:
 *         description: Handled the link update completion
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router
    .route('/link-update')
    .post(authenticate, catchAsync(handleLinkUpdateComplete))

export default router
