import express from 'express'
import {
    getUserNotifications,
    updateUserNotificationsToRead,
} from '../controllers/notificationController.js'
import { catchAsync } from '../utils/catchAsync.js'
import { authenticate } from '../utils/middleware.js'

const router = express.Router()

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: Notifications management
 */

/**
 * @swagger
 * /notifications:
 *   get:
 *     summary: Retrieve the logged in user's notifications
 *     tags: [Notifications]
 *     responses:
 *       200:
 *         description: Retrieved the logged in user's notifications
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Notification'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.route('/').get(authenticate, catchAsync(getUserNotifications))

/**
 * @swagger
 * /notifications/read:
 *   patch:
 *     summary: Update the logged in user's notifications to read
 *     tags: [Notifications]
 *     responses:
 *       204:
 *         description: Updated the logged in user's notifications to read
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router
    .route('/read')
    .patch(authenticate, catchAsync(updateUserNotificationsToRead))

export default router
