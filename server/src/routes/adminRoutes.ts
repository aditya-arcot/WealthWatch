import express from 'express'
import {
    getAccessRequests,
    reviewAccessRequest,
} from '../controllers/adminController.js'
import { catchAsync } from '../utils/catchAsync.js'
import { authenticateAdmin } from '../utils/middleware.js'

const router = express.Router()

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Admin management
 */

/**
 * @swagger
 * /admin/access-request:
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
    .route('/access-request')
    .get(authenticateAdmin, catchAsync(getAccessRequests))

/**
 * @swagger
 * /admin/access-request/:requestId:
 *   patch:
 *     summary: Review access request
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: requestId
 *         required: true
 *         description: The access request id
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               statusId:
 *                 type: number
 *                 required: true
 *     responses:
 *       204:
 *         description: Reviewed access request
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router
    .route('/access-request/:requestId')
    .patch(authenticateAdmin, catchAsync(reviewAccessRequest))

export default router