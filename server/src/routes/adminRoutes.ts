import express from 'express'
import {
    getAccessRequests,
    reviewAccessRequest,
} from '../controllers/adminController.js'
import { catchAsync } from '../utilities/catchAsync.js'
import { authenticateAdmin } from '../utilities/middleware.js'

const router = express.Router()

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Admin management
 */

/**
 * @swagger
 * /admin/access-requests:
 *   get:
 *     summary: Get access requests
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Access requests
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/AccessRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router
    .route('/access-requests')
    .get(authenticateAdmin, catchAsync(getAccessRequests))

/**
 * @swagger
 * /admin/access-requests/{requestId}:
 *   patch:
 *     summary: Review access request
 *     tags: [Admin]
 *     parameters:
 *       - $ref: '#/components/parameters/AccessRequestId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/StatusId'
 *     responses:
 *       204:
 *         description: Reviewed access request
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router
    .route('/access-requests/:requestId')
    .patch(authenticateAdmin, catchAsync(reviewAccessRequest))

export default router
