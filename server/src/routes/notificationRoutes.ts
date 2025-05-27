import express from 'express'
import {
    getUserNotifications,
    updateUserNotificationsToRead,
    updateUserNotificationToInactive,
} from '../controllers/notificationController.js'
import { authenticate, catchAsync } from '../utilities/middleware.js'

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
 *     summary: Retrieve the logged-in user's notifications
 *     tags: [Notifications]
 *     responses:
 *       200:
 *         description: Retrieved the logged-in user's notifications
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
 *     summary: Update the logged-in user's notifications to read
 *     tags: [Notifications]
 *     responses:
 *       204:
 *         description: Updated the logged-in user's notifications to read
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router
    .route('/read')
    .patch(authenticate, catchAsync(updateUserNotificationsToRead))

/**
 * @swagger
 * /notifications/{notificationId}/inactive:
 *   patch:
 *     summary: Update the logged-in user's notification to inactive
 *     tags: [Notifications]
 *     parameters:
 *       - $ref: '#/components/parameters/NotificationId'
 *     responses:
 *       204:
 *         description: Updated the logged-in user's notification to inactive
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router
    .route('/:notificationId/inactive')
    .patch(authenticate, catchAsync(updateUserNotificationToInactive))

export default router
