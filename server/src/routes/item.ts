import {
    deactivateItem,
    getUserItemsWithAccounts,
    getUserItemsWithAccountsWithHoldings,
    getUserItemsWithCreditCardAccounts,
    getUserItemsWithMortgageAccounts,
    getUserItemsWithStudentLoanAccounts,
    refreshItem,
} from '@controllers'
import { authenticate, catchAsync } from '@middleware'
import express from 'express'

const router = express.Router()

/**
 * @swagger
 * tags:
 *   name: Items
 *   description: Items management
 */

/**
 * @swagger
 * /items/with-accounts:
 *   get:
 *     summary: Retrieve the logged-in user's items with accounts
 *     tags: [Items]
 *     responses:
 *       200:
 *         description: Retrieved the logged-in user's items with accounts
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ItemWithAccounts'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router
    .route('/with-accounts')
    .get(authenticate, catchAsync(getUserItemsWithAccounts))

/**
 * @swagger
 * /items/with-accounts/with-holdings:
 *   get:
 *     summary: Retrieve the logged-in user's items with accounts with holdings
 *     tags: [Items]
 *     responses:
 *       200:
 *         description: Retrieved the logged-in user's items with accounts with holdings
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ItemWithAccountsWithHoldings'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router
    .route('/with-accounts/with-holdings')
    .get(authenticate, catchAsync(getUserItemsWithAccountsWithHoldings))

/**
 * @swagger
 * /items/with-credit-card-accounts:
 *   get:
 *     summary: Retrieve the logged-in user's items with credit card accounts
 *     tags: [Items]
 *     responses:
 *       200:
 *         description: Retrieved the logged-in user's items with credit card accounts
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ItemWithCreditCardAccounts'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router
    .route('/with-credit-card-accounts')
    .get(authenticate, catchAsync(getUserItemsWithCreditCardAccounts))

/**
 * @swagger
 * /items/with-mortgage-accounts:
 *   get:
 *     summary: Retrieve the logged-in user's items with mortgage accounts
 *     tags: [Items]
 *     responses:
 *       200:
 *         description: Retrieved the logged-in user's items with mortgage accounts
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ItemWithMortgageAccounts'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router
    .route('/with-mortgage-accounts')
    .get(authenticate, catchAsync(getUserItemsWithMortgageAccounts))

/**
 * @swagger
 * /items/with-student-loan-accounts:
 *   get:
 *     summary: Retrieve the logged-in user's items with student loan accounts
 *     tags: [Items]
 *     responses:
 *       200:
 *         description: Retrieved the logged-in user's items with student loan accounts
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ItemWithStudentLoanAccounts'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router
    .route('/with-student-loan-accounts')
    .get(authenticate, catchAsync(getUserItemsWithStudentLoanAccounts))

/**
 * @swagger
 * /items/{plaidItemId}/refresh:
 *   post:
 *     summary: Refresh an item (refresh transactions, refresh investments, queue sync balances)
 *     tags: [Items]
 *     parameters:
 *       - $ref: '#/components/parameters/PlaidItemIdPath'
 *     responses:
 *       202:
 *         description: Refreshed the item
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router
    .route('/:plaidItemId/refresh')
    .post(authenticate, catchAsync(refreshItem))

/**
 * @swagger
 * /items/{plaidItemId}:
 *   delete:
 *     summary: Deactivate an item
 *     tags: [Items]
 *     parameters:
 *       - $ref: '#/components/parameters/PlaidItemIdPath'
 *     responses:
 *       204:
 *         description: Deactivated the item
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.route('/:plaidItemId').delete(authenticate, catchAsync(deactivateItem))

export default router
