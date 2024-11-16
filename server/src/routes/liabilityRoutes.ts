import express from 'express'
import {
    getUserCreditCardLiabilities,
    getUserMortgageLiabilities,
    getUserStudentLoanLiabilities,
} from '../controllers/liabilityController.js'
import { catchAsync } from '../utils/catchAsync.js'
import { authenticate } from '../utils/middleware.js'

const router = express.Router()

/**
 * @swagger
 * tags:
 *   name: Liabilities
 *   description: Liabilities management
 */

/**
 * @swagger
 * /liabilities/credit-card:
 *   get:
 *     summary: Retrieve the logged in user's credit card liabilities
 *     tags: [Liabilities]
 *     responses:
 *       200:
 *         description: Retrieved the logged in user's credit card liabilities
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/CreditCardLiability'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router
    .route('/credit-card')
    .get(authenticate, catchAsync(getUserCreditCardLiabilities))

/**
 * @swagger
 * /liabilities/mortgage:
 *   get:
 *     summary: Retrieve the logged in user's mortgage liabilities
 *     tags: [Liabilities]
 *     responses:
 *       200:
 *         description: Retrieved the logged in user's mortgage liabilities
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/MortgageLiability'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router
    .route('/mortgage')
    .get(authenticate, catchAsync(getUserMortgageLiabilities))

/**
 * @swagger
 * /liabilities/student-loan:
 *   get:
 *     summary: Retrieve the logged in user's student loan liabilities
 *     tags: [Liabilities]
 *     responses:
 *       200:
 *         description: Retrieved the logged in user's student loan liabilities
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/StudentLoanLiability'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router
    .route('/student-loan')
    .get(authenticate, catchAsync(getUserStudentLoanLiabilities))

export default router
